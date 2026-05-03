import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError, Transaction } from 'sequelize';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserRepository } from './users.repository';
import { User, UserStatus } from './entities/user.entity';
import { UserRole } from 'src/common/enums/roles.enum';
import { UserQueryDto } from './dto/user-query.dto';
import { BaseService } from 'src/common/services/base.service';
import { EmailQueue } from 'src/configuration/bull';
import { EmailService } from 'src/configuration/email/email.service';
import { HrDepartment } from 'src/resources/hr/departments/entities/hr-department.entity';
import { HrDesignation } from 'src/resources/hr/designations/entities/hr-designation.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { PlanLimitValidationService } from 'src/common/services/plan-limit-validation.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { validateEmailDomain } from 'src/common/utils/email-domain-validation.util';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CryptoUtilityService } from 'src/common/services/crypto-utility.service';
import { randomInt } from 'crypto';

/** Length-62 alphabet for invite passwords (alphanumeric). */
const INVITE_PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class UsersService extends BaseService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly emailQueue: EmailQueue,
    private readonly emailService: EmailService,
    private readonly organizationsService: OrganizationsService,
    private readonly planLimitValidationService: PlanLimitValidationService,
    private readonly transactionManager: TransactionManager,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly cryptoUtilityService: CryptoUtilityService,
  ) {
    super(userRepository);
  }

  async findAll(query?: UserQueryDto) {
    // Pass organizationId via RepositoryOptions.organizationId for employee filtering
    // BaseRepository.applyTenantFilter() will handle it properly
    const whereConditions = Object.fromEntries(
      Object.entries({
        role: query?.role,
        status: query?.status,
      }).filter(([_, value]) => value !== undefined),
    );

    // Debug: Log the organizationId from query
    if (query?.organizationId) {
      this.logger.debug(`UsersService.findAll - organizationId from query: ${query.organizationId}`);
    }

    return this.userRepository.findAll({
      where: whereConditions,
      organizationId: query?.organizationId,
      pagination: {
        page: query?.page || 1,
        limit: query?.limit || 10,
        searchTerm: query?.search || '',
        searchFields: ['email', 'firstName', 'lastName'],
        sortBy: 'createdAt',
        sortOrder: query?.sortOrder || 'DESC',
      },
      include: [
        { model: HrDepartment, attributes: ['id', 'name'] },
        { model: HrDesignation, attributes: ['id', 'name'] },
      ],
    });
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as User;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user as User;
  }

  /**
   * Lookup by email without throwing — password reset (public / no JWT).
   * Uses model directly so tenant filter does not force organizationId when unauthenticated.
   */
  async findByEmailOptional(email: string): Promise<User | null> {
    const row = await this.userModel.findOne({
      where: { email },
    });
    return row ? (row.get({ plain: true }) as User) : null;
  }

  /** Set password after OTP verification (self-service reset; bypasses tenant-scoped repository update). */
  async updatePasswordSelfService(
    userId: string,
    plainPassword: string,
    transaction?: Transaction,
  ): Promise<void> {
    const passwordHash = await this.cryptoUtilityService.encryptPassword(plainPassword);
    await this.userModel.update(
      { passwordHash },
      { where: { id: userId }, transaction },
    );
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.transactionManager.execute(async (transaction) => {
      const currentUser = await this.userRepository.findOne({
        where: { id },
        transaction,
      });

      if (!currentUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData = { ...updateUserDto };

      const affectedCount = await this.userRepository.update(
        { id },
        updateData,
        transaction,
      );

      if (affectedCount === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.findUserById(id);
    }).catch((error) => {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists in this organization`,
        );
      }
      throw error;
    });
  }

  async removeUser(id: string): Promise<User> {
    const user = await this.findUserById(id);
    await this.softDelete({ id }, undefined);
    return user;
  }

  async permanentlyDeleteUser(id: string): Promise<User> {
    const user = await this.findUserById(id);
    await this.hardDelete({ id }, undefined);
    return user;
  }

  async restoreUser(id: string): Promise<User> {
    return this.restore({ id }, undefined);
  }

  /** Random alphanumeric password for invites (crypto-safe). */
  private generateAlphanumericInvitePassword(length = 10): string {
    let out = '';
    for (let i = 0; i < length; i++) {
      out += INVITE_PASSWORD_ALPHABET[randomInt(0, INVITE_PASSWORD_ALPHABET.length)];
    }
    return out;
  }

  async inviteUser(inviteUserDto: InviteUserDto): Promise<User> {
    validateEmailDomain(inviteUserDto.email);

    const plainPassword = this.generateAlphanumericInvitePassword(10);
    const hashedPassword =
      await this.cryptoUtilityService.encryptPassword(plainPassword);

    const newUser = await this.transactionManager.executeSerializable(
      async (transaction) => {
        await this.planLimitValidationService.validateUserLimit(
          inviteUserDto.organizationId,
          1,
        );

        return await this.userRepository.create(
          {
            email: inviteUserDto.email,
            organizationId: inviteUserDto.organizationId,
            status: UserStatus.ACTIVE,
            role: UserRole.USER,
            firstName: null,
            lastName: null,
            passwordHash: hashedPassword,
          },
          transaction,
        );
      },
    ).catch((error) => {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `User with email ${inviteUserDto.email} already exists in this organization`,
        );
      }
      throw error;
    });

    const organization = await this.organizationsService.findOrganizationById(
      inviteUserDto.organizationId,
    );

    try {
      const inviteEmailHtml = this.emailService.getInviteEmailHtml(
        inviteUserDto.email,
        organization.name,
        undefined,
        plainPassword,
      );
      await this.emailQueue.sendNotificationEmail(
        inviteUserDto.email,
        `You've been invited to join ${organization.name}`,
        inviteEmailHtml,
      );
    } catch (error) {
      this.logger.error(`Failed to queue invitation email to ${inviteUserDto.email}:`, error);
    }

    // Recalculate subscription pricing if on paid plan
    try {
      await this.subscriptionsService.recalculateSubscriptionIfNeeded(inviteUserDto.organizationId);
    } catch (error) {
      this.logger.error(
        `Failed to recalculate subscription pricing for organization ${inviteUserDto.organizationId}:`,
        error,
      );
    }

    return newUser as User;
  }

}
