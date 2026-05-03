import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SocialUserDataDto } from './dto/social-user-data.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from 'src/configuration/jwt/jwt.service';
import { UserRole } from 'src/common/enums/roles.enum';
import { CryptoUtilityService } from 'src/common/services/crypto-utility.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { SubscriptionQueue } from 'src/configuration/bull/queues/subscription.queue';
import { EmailQueue } from 'src/configuration/bull/queues/email.queue';
import { User, UserStatus } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';
import { GmailTokenService } from './services/gmail-token.service';
import { extractEmailDomain } from './utils/email-domain.util';
import { generateUniqueOrgSlug } from 'src/common/utils/slug-generator.util';
import { generateRandomOrgName } from 'src/common/utils/org-name-generator.util';
import { validateEmailDomain as validateEmailDomainUtil } from 'src/common/utils/email-domain-validation.util';
import { Transaction } from 'sequelize';
import { AuthResponse } from './utils/auth-response.interface';
import { ERRORS } from './utils/auth.constants';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly cryptoUtilityService: CryptoUtilityService,
    private readonly subscriptionQueue: SubscriptionQueue,
    private readonly emailQueue: EmailQueue,
    private readonly transactionManager: TransactionManager,
    private readonly auditLogsService: AuditLogsService,
    private readonly gmailTokenService: GmailTokenService,
  ) {}

  validateEmailDomain(email: string): void {
    validateEmailDomainUtil(email);
  }

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    this.validateEmailDomain(signupDto.email);

    const existingUser = await User.findOne({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const result = await this.transactionManager.execute(async (transaction) => {
      const { organization } = await this.findOrCreateOrganization(signupDto.email, transaction);

      const passwordHash = await this.cryptoUtilityService.encryptPassword(signupDto.password);

      const user = await User.create(
        {
          email: signupDto.email,
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          passwordHash,
          status: UserStatus.ACTIVE,
          role: UserRole.ADMIN,
          organizationId: organization.id,
        },
        { transaction },
      );

      await user.update({ createdBy: user.id }, { transaction });
      organization.createdBy = user.id;
      await organization.save({ transaction });

      user.organization = organization;

      const payload = this.buildJwtPayload(user, organization);
      const tokens = await this.jwtService.generateTokens(payload);

      return { user, organization, tokens, isNewUser: true, isNewOrg: true };
    });

    await this.handlePostSignupSideEffects(result);

    return this.buildAuthResponse(result.user, result.tokens);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await User.findOne({
      where: { email: loginDto.email },
      include: [
        {
          model: Organization,
          required: false,
          attributes: ['id', 'name', 'slug', 'domain'],
        },
      ],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await this.cryptoUtilityService.verifyPassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await user.update({ lastLoginAt: new Date() });

    const organization = user.organization ?? (await Organization.findByPk(user.organizationId));
    const payload = this.buildJwtPayload(user, organization);
    const tokens = await this.jwtService.generateTokens(payload);

    return this.buildAuthResponse(user, tokens);
  }

  async validateOrCreateSocialUser(socialData: SocialUserDataDto): Promise<AuthResponse> {
    let isNewOrg = false;
    let isNewUser = false;
    let organization: Organization | null = null;

    const result = await this.transactionManager.execute(async (transaction) => {
      const userResult = await this.findOrCreateUser(socialData, transaction);
      isNewUser = userResult.isNew;
      isNewOrg = userResult.isNewOrg;
      organization = userResult.organization;

      await this.gmailTokenService.ensureGmailToken(userResult.user, socialData, transaction);

      const payload = this.buildJwtPayload(userResult.user, organization);
      const tokens = await this.jwtService.generateTokens(payload);

      return { user: userResult.user, organization, tokens, isNewUser, isNewOrg };
    });

    await this.handlePostSignupSideEffects(result);

    return this.buildAuthResponse(result.user, result.tokens);
  }

  private async findOrCreateOrganization(
    userEmail: string,
    transaction: Transaction,
  ): Promise<{ organization: Organization; isNew: boolean }> {
    if (!userEmail) {
      throw new BadRequestException(`${ERRORS.EMAIL_REQUIRED} to create organization`);
    }

    this.validateEmailDomain(userEmail);

    const emailDomain = extractEmailDomain(userEmail);
    const orgSlug = await generateUniqueOrgSlug(transaction);
    const orgName = generateRandomOrgName();

    const newOrganization = await Organization.create(
      {
        name: orgName,
        slug: orgSlug,
        domain: emailDomain,
        timezone: 'UTC',
        description: `Organization for ${userEmail}`,
        website: `https://${emailDomain}`,
        email: userEmail,
        billingEmail: userEmail,
        status: 'ACTIVE',
        settings: {
          defaultLanguage: 'en',
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
          },
        },
      },
      { transaction },
    );

    this.logger.log(`Created new organization: ${newOrganization.id} for email: ${userEmail}`);

    return { organization: newOrganization, isNew: true };
  }

  private async findOrCreateUser(
    socialData: SocialUserDataDto,
    transaction: Transaction,
  ): Promise<{ user: User; isNew: boolean; organization: Organization; isNewOrg: boolean }> {
    const user = await User.findOne({
      where: { email: socialData.email },
      include: [
        {
          model: Organization,
          required: false,
          attributes: ['id', 'name', 'slug', 'domain'],
        },
      ],
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (user) {
      if (user.status === UserStatus.INACTIVE) {
        user.status = UserStatus.ACTIVE;
      }

      user.socialId = socialData.socialId;
      user.socialProvider = socialData.socialProvider;

      if (socialData.avatar) {
        user.avatarUrl = socialData.avatar;
      }
      if (!user.firstName && socialData.firstName) {
        user.firstName = socialData.firstName;
      }
      if (!user.lastName && socialData.lastName) {
        user.lastName = socialData.lastName;
      }

      await user.save({ transaction });

      const organization = user.organization ?? (await Organization.findByPk(user.organizationId, { transaction }));

      return { user, isNew: false, organization, isNewOrg: false };
    }

    this.validateEmailDomain(socialData.email);

    const orgResult = await this.findOrCreateOrganization(socialData.email, transaction);
    const organization = orgResult.organization;

    const newUser = await User.create(
      {
        email: socialData.email,
        firstName: socialData.firstName,
        lastName: socialData.lastName,
        avatarUrl: socialData.avatar,
        socialId: socialData.socialId,
        socialProvider: socialData.socialProvider,
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
        organizationId: organization.id,
      },
      { transaction },
    );

    await newUser.update({ createdBy: newUser.id }, { transaction });
    organization.createdBy = newUser.id;
    await organization.save({ transaction });

    newUser.organization = organization;

    return { user: newUser, isNew: true, organization, isNewOrg: true };
  }

  private async handlePostSignupSideEffects(result: {
    user: User;
    organization: Organization;
    isNewUser: boolean;
    isNewOrg: boolean;
  }): Promise<void> {
    const { user, organization, isNewUser, isNewOrg } = result;

    if (isNewOrg && organization?.id) {
      try {
        await this.auditLogsService.createAuditLog({
          organizationId: organization.id,
          performedByUserId: user.id,
          module: 'ORGANIZATIONS',
          action: AuditAction.CREATE,
          recordId: organization.id,
          description: `Organization "${organization.name}" created during signup`,
          details: {
            organizationName: organization.name,
            organizationSlug: organization.slug,
            userEmail: user.email,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log organization creation:', error);
      }

      try {
        await this.subscriptionQueue.createDefaultSubscription(organization.id);
      } catch (error) {
        this.logger.error(`Failed to queue subscription for org ${organization.id}:`, error);
      }
    }

    if (isNewUser && user?.id) {
      try {
        await this.auditLogsService.createAuditLog({
          organizationId: organization?.id,
          performedByUserId: user.id,
          module: 'USERS',
          action: AuditAction.CREATE,
          recordId: user.id,
          description: `User "${user.firstName} ${user.lastName}" (${user.email}) signed up`,
          details: {
            userEmail: user.email,
            userRole: user.role,
            organizationId: organization?.id,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log user creation:', error);
      }

      try {
        const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        await this.emailQueue.sendWelcomeEmail(user.email, userName);
      } catch (error) {
        this.logger.error(`Failed to queue welcome email for user ${user.id}:`, error);
      }
    }
  }

  private buildAuthResponse(
    user: User,
    tokens: { accessToken: string; refreshToken: string },
  ): AuthResponse {
    const org = user.organization;
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        organizationId: user.organizationId,
        organization: org
          ? { id: org.id, name: org.name, slug: org.slug, domain: org.domain }
          : undefined,
      },
    };
  }

  private buildJwtPayload(user: User, organization?: Organization) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      organization: {
        id: organization?.id || user.organizationId,
        name: organization?.name,
        slug: organization?.slug,
        domain: organization?.domain,
      },
    };
  }
}
