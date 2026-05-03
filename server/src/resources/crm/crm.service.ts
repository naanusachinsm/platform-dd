import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { CrmCompanyRepository } from './crm-company.repository';
import { CrmContactRepository } from './crm-contact.repository';
import { CrmDealRepository } from './crm-deal.repository';
import { CrmActivityRepository } from './crm-activity.repository';
import { CrmCompany } from './entities/crm-company.entity';
import { CrmContact } from './entities/crm-contact.entity';
import { CrmDeal, DealStage, STAGE_PROBABILITY } from './entities/crm-deal.entity';
import { CrmActivity } from './entities/crm-activity.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/create-deal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CompanyQueryDto, ContactQueryDto, DealQueryDto, ActivityQueryDto } from './dto/crm-query.dto';
import { CrmActivityTrackerService } from './services/crm-activity-tracker.service';
import { CrmAuditAction, CrmAuditEntityType } from './entities/crm-audit-activity.entity';

@Injectable()
export class CrmService {
  constructor(
    private readonly companyRepository: CrmCompanyRepository,
    private readonly contactRepository: CrmContactRepository,
    private readonly dealRepository: CrmDealRepository,
    private readonly activityRepository: CrmActivityRepository,
    private readonly activityTracker: CrmActivityTrackerService,
    private readonly transactionManager: TransactionManager,
    private readonly userContextService: UserContextService,
  ) {}

  private getOrganizationId(): string {
    const user = this.userContextService.getCurrentUser();
    return user?.organizationId;
  }

  private getDateRangeFilter(dateRange?: string): WhereOptions<CrmDeal> | null {
    if (!dateRange || dateRange === 'all') return null;

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_quarter': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), qMonth, 1);
        break;
      }
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return null;
    }

    return { createdAt: { [Op.gte]: startDate } } as any;
  }

  // ─── Companies ──────────────────────────────────────────

  async createCompany(dto: CreateCompanyDto): Promise<CrmCompany> {
    return this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();

      const existing = await this.companyRepository.findOne({
        where: { name: dto.name, organizationId: orgId } as any,
      });
      if (existing) {
        throw new BadRequestException(`A company named '${dto.name}' already exists`);
      }

      const data = { ...dto, organizationId: orgId };
      const result = await this.companyRepository.create(data, transaction);
      this.activityTracker.log(CrmAuditAction.CREATE, CrmAuditEntityType.COMPANY, (result as any).id, `Company "${dto.name}" created`);
      return result;
    });
  }

  async findAllCompanies(query: CompanyQueryDto) {
    const where: WhereOptions<CrmCompany> = {};
    if (query.status) where.status = query.status;
    if (query.size) where.size = query.size;
    if (query.industry) where.industry = query.industry;

    return this.companyRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['name', 'email', 'industry', 'city', 'country'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findCompanyById(id: string): Promise<CrmCompany> {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new NotFoundException(`Company with ID '${id}' not found`);
    return company as CrmCompany;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<CrmCompany> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.companyRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Company with ID '${id}' not found`);

      if (dto.name) {
        const duplicate = await this.companyRepository.findOne({
          where: { name: dto.name, organizationId: (existing as any).organizationId } as any,
        });
        if (duplicate && (duplicate as any).id !== id) {
          throw new BadRequestException(`A company named '${dto.name}' already exists`);
        }
      }

      await this.companyRepository.update({ id }, dto as any, transaction);
      const result = await this.companyRepository.findById(id, transaction) as CrmCompany;
      this.activityTracker.log(CrmAuditAction.UPDATE, CrmAuditEntityType.COMPANY, id, `Company "${(result as any).name}" updated`);
      return result;
    });
  }

  async deleteCompany(id: string): Promise<CrmCompany> {
    return this.transactionManager.execute(async (transaction) => {
      const company = await this.companyRepository.findById(id, transaction);
      if (!company) throw new NotFoundException(`Company with ID '${id}' not found`);
      this.activityTracker.log(CrmAuditAction.DELETE, CrmAuditEntityType.COMPANY, id, `Company "${(company as any).name}" deleted`);
      await this.companyRepository.delete({ id }, transaction);
      return company as CrmCompany;
    });
  }

  // ─── Contacts ──────────────────────────────────────────

  async createContact(dto: CreateContactDto): Promise<CrmContact> {
    return this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();

      if (dto.email) {
        const existing = await this.contactRepository.findOne({
          where: { email: dto.email, organizationId: orgId } as any,
        });
        if (existing) {
          throw new BadRequestException(`A contact with email '${dto.email}' already exists`);
        }
      }

      if (dto.companyId) {
        const company = await this.companyRepository.findById(dto.companyId, transaction);
        if (!company) {
          throw new BadRequestException(`Company with ID '${dto.companyId}' not found`);
        }
      }

      const data = { ...dto, organizationId: orgId };
      const result = await this.contactRepository.create(data as any, transaction);
      this.activityTracker.log(CrmAuditAction.CREATE, CrmAuditEntityType.CONTACT, (result as any).id, `Contact "${dto.firstName} ${dto.lastName}" created`);
      return result;
    });
  }

  async findAllContacts(query: ContactQueryDto) {
    const where: WhereOptions<CrmContact> = {};
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.companyId) where.companyId = query.companyId;
    if (query.ownerId) where.ownerId = query.ownerId;

    return this.contactRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['firstName', 'lastName', 'email', 'jobTitle'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
      ],
      organizationId: query.organizationId,
    });
  }

  async findContactById(id: string): Promise<CrmContact> {
    const contact = await this.contactRepository.findOne({
      where: { id } as any,
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!contact) throw new NotFoundException(`Contact with ID '${id}' not found`);
    return contact as CrmContact;
  }

  async updateContact(id: string, dto: UpdateContactDto): Promise<CrmContact> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.contactRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Contact with ID '${id}' not found`);

      if (dto.email) {
        const duplicate = await this.contactRepository.findOne({
          where: { email: dto.email, organizationId: (existing as any).organizationId } as any,
        });
        if (duplicate && (duplicate as any).id !== id) {
          throw new BadRequestException(`A contact with email '${dto.email}' already exists`);
        }
      }

      if (dto.companyId) {
        const company = await this.companyRepository.findById(dto.companyId, transaction);
        if (!company) {
          throw new BadRequestException(`Company with ID '${dto.companyId}' not found`);
        }
      }

      await this.contactRepository.update({ id }, dto as any, transaction);
      const result = await this.findContactById(id);
      this.activityTracker.log(CrmAuditAction.UPDATE, CrmAuditEntityType.CONTACT, id, `Contact "${(result as any).firstName} ${(result as any).lastName}" updated`);
      return result;
    });
  }

  async deleteContact(id: string): Promise<CrmContact> {
    return this.transactionManager.execute(async (transaction) => {
      const contact = await this.contactRepository.findById(id, transaction);
      if (!contact) throw new NotFoundException(`Contact with ID '${id}' not found`);
      this.activityTracker.log(CrmAuditAction.DELETE, CrmAuditEntityType.CONTACT, id, `Contact "${(contact as any).firstName} ${(contact as any).lastName}" deleted`);
      await this.contactRepository.delete({ id }, transaction);
      return contact as CrmContact;
    });
  }

  // ─── Deals ──────────────────────────────────────────

  async createDeal(dto: CreateDealDto): Promise<CrmDeal> {
    return this.transactionManager.execute(async (transaction) => {
      if (dto.contactId) {
        const contact = await this.contactRepository.findById(dto.contactId, transaction);
        if (!contact) throw new BadRequestException(`Contact with ID '${dto.contactId}' not found`);
      }
      if (dto.companyId) {
        const company = await this.companyRepository.findById(dto.companyId, transaction);
        if (!company) throw new BadRequestException(`Company with ID '${dto.companyId}' not found`);
      }

      const stage = dto.stage || DealStage.LEAD;
      const data = {
        ...dto,
        organizationId: this.getOrganizationId(),
        stage,
        probability: dto.probability ?? STAGE_PROBABILITY[stage],
      };
      const result = await this.dealRepository.create(data, transaction);
      this.activityTracker.log(CrmAuditAction.CREATE, CrmAuditEntityType.DEAL, (result as any).id, `Deal "${dto.title}" created`);
      return result;
    });
  }

  async findAllDeals(query: DealQueryDto) {
    const where: WhereOptions<CrmDeal> = {};
    if (query.stage) where.stage = query.stage;
    if (query.priority) where.priority = query.priority;
    if (query.contactId) where.contactId = query.contactId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.ownerId) where.ownerId = query.ownerId;

    const dateFilter = this.getDateRangeFilter(query.dateRange);
    if (dateFilter) Object.assign(where, dateFilter);

    return this.dealRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['title'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
      ],
      organizationId: query.organizationId,
    });
  }

  async findDealById(id: string): Promise<CrmDeal> {
    const deal = await this.dealRepository.findOne({
      where: { id } as any,
      include: [
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!deal) throw new NotFoundException(`Deal with ID '${id}' not found`);
    return deal as CrmDeal;
  }

  async updateDeal(id: string, dto: UpdateDealDto): Promise<CrmDeal> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.dealRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Deal with ID '${id}' not found`);

      const updateData: any = { ...dto };
      if (dto.stage && dto.probability === undefined) {
        updateData.probability = STAGE_PROBABILITY[dto.stage];
      }
      if (dto.stage === DealStage.CLOSED_WON || dto.stage === DealStage.CLOSED_LOST) {
        updateData.actualCloseDate = updateData.actualCloseDate || new Date().toISOString().split('T')[0];
      }

      await this.dealRepository.update({ id }, updateData, transaction);
      const result = await this.findDealById(id);
      this.activityTracker.log(CrmAuditAction.UPDATE, CrmAuditEntityType.DEAL, id, `Deal "${(result as any).title}" updated`);
      return result;
    });
  }

  async updateDealStage(id: string, dto: UpdateDealStageDto): Promise<CrmDeal> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.dealRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Deal with ID '${id}' not found`);

      const updateData: any = {
        stage: dto.stage,
        probability: STAGE_PROBABILITY[dto.stage],
      };

      if (dto.position !== undefined) {
        updateData.position = dto.position;
      }

      if (dto.stage === DealStage.CLOSED_WON || dto.stage === DealStage.CLOSED_LOST) {
        updateData.actualCloseDate = new Date().toISOString().split('T')[0];
      }

      await this.dealRepository.update({ id }, updateData, transaction);
      const result = await this.findDealById(id);
      this.activityTracker.log(CrmAuditAction.STAGE_CHANGE, CrmAuditEntityType.DEAL, id, `Deal "${(result as any).title}" stage changed to ${dto.stage}`);
      return result;
    });
  }

  async deleteDeal(id: string): Promise<CrmDeal> {
    return this.transactionManager.execute(async (transaction) => {
      const deal = await this.dealRepository.findById(id, transaction);
      if (!deal) throw new NotFoundException(`Deal with ID '${id}' not found`);
      this.activityTracker.log(CrmAuditAction.DELETE, CrmAuditEntityType.DEAL, id, `Deal "${(deal as any).title}" deleted`);
      await this.dealRepository.delete({ id }, transaction);
      return deal as CrmDeal;
    });
  }

  async getDealsPipeline(organizationId?: string, dateRange?: string) {
    const stages = Object.values(DealStage);
    const pipeline: Record<string, any> = {};
    const dateFilter = this.getDateRangeFilter(dateRange);

    for (const stage of stages) {
      const where: WhereOptions<CrmDeal> = { stage };
      if (dateFilter) Object.assign(where, dateFilter);
      const result = await this.dealRepository.findAll({
        where,
        pagination: {
          page: 1,
          limit: 100,
          searchTerm: '',
          searchFields: [],
          sortBy: 'position',
          sortOrder: 'ASC',
        },
        include: [
          { model: CrmContact, attributes: ['id', 'firstName', 'lastName'] },
          { model: CrmCompany, attributes: ['id', 'name'] },
          { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        ],
        organizationId,
      });
      pipeline[stage] = result.data;
    }

    return pipeline;
  }

  // ─── Activities ──────────────────────────────────────────

  async createActivity(dto: CreateActivityDto): Promise<CrmActivity> {
    if (!dto.contactId && !dto.companyId && !dto.dealId) {
      throw new BadRequestException('At least one of contactId, companyId, or dealId must be provided');
    }

    return this.transactionManager.execute(async (transaction) => {
      const data = {
        ...dto,
        organizationId: this.getOrganizationId(),
      };
      return this.activityRepository.create(data as any, transaction);
    });
  }

  async findAllActivities(query: ActivityQueryDto) {
    const where: WhereOptions<CrmActivity> = {};
    if (query.contactId) where.contactId = query.contactId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.isReminder !== undefined) where.isReminder = query.isReminder;

    return this.activityRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        searchTerm: query.searchTerm || '',
        searchFields: ['subject', 'description'],
        sortBy: 'activityDate',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName'] },
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmDeal, attributes: ['id', 'title'] },
      ],
      organizationId: query.organizationId,
    });
  }

  async findActivityById(id: string): Promise<CrmActivity> {
    const activity = await this.activityRepository.findOne({
      where: { id } as any,
      include: [
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName'] },
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmDeal, attributes: ['id', 'title'] },
      ],
    });
    if (!activity) throw new NotFoundException(`Activity with ID '${id}' not found`);
    return activity as CrmActivity;
  }

  async updateActivity(id: string, dto: UpdateActivityDto): Promise<CrmActivity> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.activityRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Activity with ID '${id}' not found`);
      await this.activityRepository.update({ id }, dto as any, transaction);
      return this.findActivityById(id);
    });
  }

  async deleteActivity(id: string): Promise<CrmActivity> {
    return this.transactionManager.execute(async (transaction) => {
      const activity = await this.activityRepository.findById(id, transaction);
      if (!activity) throw new NotFoundException(`Activity with ID '${id}' not found`);
      await this.activityRepository.delete({ id }, transaction);
      return activity as CrmActivity;
    });
  }

  // ─── Dashboard ──────────────────────────────────────────

  async getDashboardStats(organizationId?: string) {
    const stages = Object.values(DealStage);
    const pipelineByStage: Record<string, { count: number; value: number }> = {};

    for (const stage of stages) {
      const where: WhereOptions<CrmDeal> = { stage };
      const result = await this.dealRepository.findAll({
        where,
        pagination: { page: 1, limit: 1000, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
        organizationId,
      });
      const deals = result.data as any[];
      pipelineByStage[stage] = {
        count: result.total,
        value: deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
      };
    }

    const totalDeals = Object.values(pipelineByStage).reduce((s, v) => s + v.count, 0);
    const totalPipelineValue = Object.values(pipelineByStage).reduce((s, v) => s + v.value, 0);
    const wonDeals = pipelineByStage[DealStage.CLOSED_WON] || { count: 0, value: 0 };
    const lostDeals = pipelineByStage[DealStage.CLOSED_LOST] || { count: 0, value: 0 };
    const closedTotal = wonDeals.count + lostDeals.count;
    const winRate = closedTotal > 0 ? Math.round((wonDeals.count / closedTotal) * 100) : 0;

    const openStages = [DealStage.LEAD, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION];
    const weightedForecast = openStages.reduce((sum, stage) => {
      const prob = STAGE_PROBABILITY[stage] / 100;
      return sum + (pipelineByStage[stage]?.value || 0) * prob;
    }, 0);

    const contactsResult = await this.contactRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [] },
      organizationId,
    });

    const companiesResult = await this.companyRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [] },
      organizationId,
    });

    const upcomingReminders = await this.activityRepository.findAll({
      where: {
        isReminder: true,
        status: 'PLANNED' as any,
        dueDate: { [Op.gte]: new Date().toISOString().split('T')[0] } as any,
      },
      pagination: { page: 1, limit: 5, searchTerm: '', searchFields: [], sortBy: 'dueDate', sortOrder: 'ASC' },
      include: [
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName'] },
        { model: CrmDeal, attributes: ['id', 'title'] },
      ],
      organizationId,
    });

    return {
      totalContacts: contactsResult.total,
      totalCompanies: companiesResult.total,
      totalDeals,
      totalPipelineValue,
      wonRevenue: wonDeals.value,
      winRate,
      weightedForecast: Math.round(weightedForecast * 100) / 100,
      pipelineByStage,
      upcomingReminders: upcomingReminders.data,
    };
  }

  // ─── CSV Import ──────────────────────────────────────────

  async importContacts(rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> {
    const orgId = this.getOrganizationId();
    let imported = 0;
    const errors: string[] = [];
    const validStatuses = ['LEAD', 'PROSPECT', 'CUSTOMER', 'CHURNED'];
    const validSources = ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_OUTREACH', 'EVENT', 'OTHER'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      try {
        const firstName = row.firstName?.trim();
        const lastName = row.lastName?.trim();
        const email = row.email?.trim();
        const status = row.status?.trim()?.toUpperCase();
        const source = row.source?.trim()?.toUpperCase();

        if (!firstName || !lastName) {
          errors.push(`Row ${rowNum}: firstName and lastName are required`);
          continue;
        }

        if (email) {
          const existing = await this.contactRepository.findOne({
            where: { email, organizationId: orgId } as any,
          });
          if (existing) {
            errors.push(`Row ${rowNum}: Contact with email '${email}' already exists`);
            continue;
          }
        }

        if (status && !validStatuses.includes(status)) {
          errors.push(`Row ${rowNum}: Invalid status '${row.status}'. Must be one of: ${validStatuses.join(', ')}`);
          continue;
        }

        if (source && !validSources.includes(source)) {
          errors.push(`Row ${rowNum}: Invalid source '${row.source}'. Must be one of: ${validSources.join(', ')}`);
          continue;
        }

        await this.contactRepository.create({
          organizationId: orgId,
          firstName,
          lastName,
          email: email || undefined,
          phone: row.phone?.trim() || undefined,
          jobTitle: row.jobTitle?.trim() || undefined,
          status: status || 'LEAD',
          source: source || undefined,
          notes: row.notes?.trim() || undefined,
        } as any);
        imported++;
      } catch (err: any) {
        const msg = this.extractImportError(err);
        errors.push(`Row ${rowNum}: ${msg}`);
      }
    }

    if (imported > 0) {
      this.activityTracker.log(CrmAuditAction.IMPORT, CrmAuditEntityType.CONTACT, undefined as any, `${imported} contacts imported via CSV`, { imported, errorCount: errors.length });
    }
    return { imported, errors };
  }

  async importCompanies(rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> {
    const orgId = this.getOrganizationId();
    let imported = 0;
    const errors: string[] = [];
    const validStatuses = ['ACTIVE', 'INACTIVE'];
    const validSizes = ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      try {
        const name = row.name?.trim();
        const status = row.status?.trim()?.toUpperCase();
        const size = row.size?.trim()?.toUpperCase();

        if (!name) {
          errors.push(`Row ${rowNum}: name is required`);
          continue;
        }

        const existing = await this.companyRepository.findOne({
          where: { name, organizationId: orgId } as any,
        });
        if (existing) {
          errors.push(`Row ${rowNum}: Company '${name}' already exists`);
          continue;
        }

        if (status && !validStatuses.includes(status)) {
          errors.push(`Row ${rowNum}: Invalid status '${row.status}'. Must be one of: ${validStatuses.join(', ')}`);
          continue;
        }

        if (size && !validSizes.includes(size)) {
          errors.push(`Row ${rowNum}: Invalid size '${row.size}'. Must be one of: ${validSizes.join(', ')}`);
          continue;
        }

        await this.companyRepository.create({
          organizationId: orgId,
          name,
          industry: row.industry?.trim() || undefined,
          website: row.website?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          email: row.email?.trim() || undefined,
          city: row.city?.trim() || undefined,
          country: row.country?.trim() || undefined,
          size: size || undefined,
          status: status || 'ACTIVE',
          notes: row.notes?.trim() || undefined,
        } as any);
        imported++;
      } catch (err: any) {
        const msg = this.extractImportError(err);
        errors.push(`Row ${rowNum}: ${msg}`);
      }
    }

    if (imported > 0) {
      this.activityTracker.log(CrmAuditAction.IMPORT, CrmAuditEntityType.COMPANY, undefined as any, `${imported} companies imported via CSV`, { imported, errorCount: errors.length });
    }
    return { imported, errors };
  }

  private extractImportError(err: any): string {
    if (err.errors?.length) {
      return err.errors.map((e: any) => `${e.path}: ${e.message}`).join('; ');
    }
    if (err.original?.sqlMessage) {
      if (err.original.sqlMessage.includes('Duplicate entry')) {
        return 'Duplicate record already exists';
      }
      return err.original.sqlMessage;
    }
    if (err.message === 'Validation error') {
      return 'Duplicate record already exists';
    }
    return err.message || 'Unknown error';
  }
}
