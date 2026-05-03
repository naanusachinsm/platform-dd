import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationRepository } from './organizations.repository';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { OrganizationValidator } from './services/organization-validation.service';
import { SubscriptionQueue } from 'src/configuration/bull/queues/subscription.queue';
import { Transaction, WhereOptions } from 'sequelize';
import { generateUniqueOrgSlug } from 'src/common/utils/slug-generator.util';
import { defaultOrganizationConfig } from './config/organization.config';

@Injectable()
export class OrganizationsService {
  private readonly config = defaultOrganizationConfig;

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly transactionManager: TransactionManager,
    private readonly userContextService: UserContextService,
    private readonly organizationValidator: OrganizationValidator,
    private readonly subscriptionQueue: SubscriptionQueue,
  ) {}

  private async findById(id: string, transaction?: Transaction): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id, transaction);
    if (!organization) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }
    return organization as Organization;
  }

  private assertOwnership(organization: Organization): void {
    const currentUser = this.userContextService.getCurrentUser();
    if (currentUser?.type === 'employee') return;

    const userOrgId = currentUser?.organizationId;
    if (!userOrgId || organization.id !== userOrgId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  private mergeSettings(current: Record<string, any> | null, newSettings: Record<string, any>): Record<string, any> {
    const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(newSettings)) {
      if (!forbidden.has(key)) {
        cleaned[key] = newSettings[key];
      }
    }
    return { ...(current || {}), ...cleaned };
  }

  private async updateAndReturn(
    id: string,
    data: Partial<Organization>,
    transaction?: Transaction,
  ): Promise<Organization> {
    const affectedCount = await this.organizationRepository.update(
      { id },
      data,
      transaction
    );

    if (affectedCount === 0) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return this.findById(id, transaction);
  }

  async createOrganization(createDto: CreateOrganizationDto): Promise<Organization> {
    const currentUser = this.userContextService.getCurrentUser();
    const isEmployee = currentUser?.type === 'employee';

    if (!isEmployee && currentUser?.sub) {
      const result = await this.organizationRepository.findAll({
        where: { createdBy: currentUser.sub } as WhereOptions<Organization>,
        pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [] },
      });
      if (result.total >= this.config.businessRules.maxOrgsPerUser) {
        throw new BadRequestException(
          `You can create a maximum of ${this.config.businessRules.maxOrgsPerUser} organizations`,
        );
      }
    }

    const organization = await this.transactionManager.execute(async (transaction) => {
      if (!createDto.slug) {
        createDto.slug = await generateUniqueOrgSlug(transaction);
      }

      const validatedDto = await this.organizationValidator.validateAndSanitize(createDto, {
        transaction,
      });

      return this.organizationRepository.create(validatedDto, transaction);
    });

    this.subscriptionQueue.createDefaultSubscription(organization.id).catch(() => {});

    return organization;
  }

  async findAll(query?: OrganizationQueryDto) {
    const currentUser = this.userContextService.getCurrentUser();
    const isEmployee = currentUser?.type === 'employee';
    const queryOrganizationId = query?.organizationId;

    const whereConditions: WhereOptions<Organization> = {};

    if (query?.domain) {
      whereConditions.domain = query.domain;
    }

    if (isEmployee) {
      if (queryOrganizationId) {
        whereConditions.id = queryOrganizationId;
      }
    } else {
      const userOrgId = currentUser?.organizationId;
      if (userOrgId) {
        whereConditions.id = userOrgId;
      } else {
        whereConditions.id = null;
      }
    }

    if (query?.status) {
      whereConditions.status = query.status;
    }

    return this.organizationRepository.findAll({
      where: whereConditions,
      pagination: {
        page: query?.page || 1,
        limit: query?.limit || 10,
        searchTerm: query?.search || query?.searchTerm || '',
        searchFields: ['name', 'slug', 'domain', 'billingEmail'],
        sortBy: 'createdAt',
        sortOrder: query?.sortOrder || 'DESC',
      },
    });
  }

  async findOrganizationById(id: string): Promise<Organization> {
    const organization = await this.findById(id);
    this.assertOwnership(organization);
    return organization;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const where = this.buildTenantScopedWhere({ slug });
    const organization = await this.organizationRepository.findOne({ where });
    if (!organization) {
      throw new NotFoundException(`Organization with slug '${slug}' not found`);
    }
    return organization as Organization;
  }

  async findByDomain(domain: string): Promise<Organization> {
    const where = this.buildTenantScopedWhere({ domain });
    const organization = await this.organizationRepository.findOne({ where });
    if (!organization) {
      throw new NotFoundException(`Organization with domain '${domain}' not found`);
    }
    return organization as Organization;
  }

  private buildTenantScopedWhere(
    conditions: WhereOptions<Organization>,
  ): WhereOptions<Organization> {
    const currentUser = this.userContextService.getCurrentUser();
    const isEmployee = currentUser?.type === 'employee';

    if (isEmployee) {
      return conditions;
    }

    const userOrgId = currentUser?.organizationId;
    if (userOrgId) {
      return { ...conditions, id: userOrgId } as WhereOptions<Organization>;
    }

    return { ...conditions, id: null } as WhereOptions<Organization>;
  }

  async updateOrganization(id: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.findById(id, transaction);
      this.assertOwnership(existing);

      const validatedDto = await this.organizationValidator.validateAndSanitize(
        updateDto,
        { isUpdate: true, excludeId: id, transaction }
      );

      return this.updateAndReturn(id, validatedDto, transaction);
    });
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<Organization> {
    return this.transactionManager.execute(async (transaction) => {
      const organization = await this.findById(id, transaction);
      this.assertOwnership(organization);

      const mergedSettings = this.mergeSettings(
        organization.settings as Record<string, any> | null,
        settings
      );

      return this.updateAndReturn(id, { settings: mergedSettings }, transaction);
    });
  }

  async removeOrganization(id: string): Promise<Organization> {
    if (!this.config.businessRules.allowOrgSoftDelete) {
      throw new ForbiddenException('Organization deletion is not allowed');
    }

    return this.transactionManager.execute(async (transaction) => {
      const organization = await this.findById(id, transaction);
      this.assertOwnership(organization);
      await this.organizationRepository.delete({ id }, transaction);
      return organization;
    });
  }

  async permanentlyDeleteOrganization(id: string): Promise<Organization> {
    if (!this.config.businessRules.allowOrgDeletion) {
      throw new ForbiddenException('Permanent organization deletion is not allowed');
    }

    return this.transactionManager.execute(async (transaction) => {
      const organization = await this.findById(id, transaction);
      this.assertOwnership(organization);
      await this.organizationRepository.forceDelete({ id }, transaction);
      return organization;
    });
  }

  async restoreOrganization(id: string): Promise<Organization> {
    return this.transactionManager.execute(async (transaction) => {
      await this.organizationRepository.restore({ id }, transaction);
      const restored = await this.findById(id, transaction);
      this.assertOwnership(restored);
      return restored;
    });
  }
}
