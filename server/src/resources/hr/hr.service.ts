import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { HrDepartmentsRepository } from './departments/hr-departments.repository';
import { HrDesignationsRepository } from './designations/hr-designations.repository';
import { HrLeaveTypesRepository } from './leave/hr-leave-types.repository';
import { HrLeaveRequestsRepository } from './leave/hr-leave-requests.repository';
import { HrLeaveBalancesRepository } from './leave/hr-leave-balances.repository';
import { HrAttendanceRepository } from './attendance/hr-attendance.repository';
import { HrPayrollRepository } from './payroll/hr-payroll.repository';
import { HrAnnouncementsRepository } from './announcements/hr-announcements.repository';
import { HrDocumentsRepository } from './documents/hr-documents.repository';
import { HrDepartment } from './departments/entities/hr-department.entity';
import { HrDesignation } from './designations/entities/hr-designation.entity';
import { HrLeaveType } from './leave/entities/hr-leave-type.entity';
import { HrLeaveRequest, HrLeaveRequestStatus } from './leave/entities/hr-leave-request.entity';
import { HrLeaveBalance } from './leave/entities/hr-leave-balance.entity';
import { HrAttendance } from './attendance/entities/hr-attendance.entity';
import { HrPayroll } from './payroll/entities/hr-payroll.entity';
import { HrAnnouncement, HrAnnouncementStatus } from './announcements/entities/hr-announcement.entity';
import { HrDocument } from './documents/entities/hr-document.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { InjectModel } from '@nestjs/sequelize';
import { CreateHrDepartmentDto } from './departments/dto/create-hr-department.dto';
import { UpdateHrDepartmentDto } from './departments/dto/update-hr-department.dto';
import { HrDepartmentQueryDto } from './departments/dto/hr-department-query.dto';
import { CreateHrDesignationDto } from './designations/dto/create-hr-designation.dto';
import { UpdateHrDesignationDto } from './designations/dto/update-hr-designation.dto';
import { HrDesignationQueryDto } from './designations/dto/hr-designation-query.dto';
import { CreateHrLeaveTypeDto } from './leave/dto/create-hr-leave-type.dto';
import { UpdateHrLeaveTypeDto } from './leave/dto/update-hr-leave-type.dto';
import { HrLeaveTypeQueryDto } from './leave/dto/hr-leave-type-query.dto';
import { CreateHrLeaveRequestDto } from './leave/dto/create-hr-leave-request.dto';
import { UpdateHrLeaveRequestDto } from './leave/dto/update-hr-leave-request.dto';
import { HrLeaveQueryDto } from './leave/dto/hr-leave-query.dto';
import { CreateHrLeaveBalanceDto } from './leave/dto/create-hr-leave-balance.dto';
import { HrLeaveBalanceQueryDto } from './leave/dto/hr-leave-balance-query.dto';
import { CreateHrAttendanceDto } from './attendance/dto/create-hr-attendance.dto';
import { UpdateHrAttendanceDto } from './attendance/dto/update-hr-attendance.dto';
import { HrAttendanceQueryDto } from './attendance/dto/hr-attendance-query.dto';
import { CreateHrPayrollDto } from './payroll/dto/create-hr-payroll.dto';
import { UpdateHrPayrollDto } from './payroll/dto/update-hr-payroll.dto';
import { HrPayrollQueryDto } from './payroll/dto/hr-payroll-query.dto';
import { CreateHrAnnouncementDto } from './announcements/dto/create-hr-announcement.dto';
import { UpdateHrAnnouncementDto } from './announcements/dto/update-hr-announcement.dto';
import { HrAnnouncementQueryDto } from './announcements/dto/hr-announcement-query.dto';
import { CreateHrDocumentDto } from './documents/dto/create-hr-document.dto';
import { UpdateHrDocumentDto } from './documents/dto/update-hr-document.dto';
import { HrDocumentQueryDto } from './documents/dto/hr-document-query.dto';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(
    private readonly hrDepartmentsRepository: HrDepartmentsRepository,
    private readonly hrDesignationsRepository: HrDesignationsRepository,
    private readonly hrLeaveTypesRepository: HrLeaveTypesRepository,
    private readonly hrLeaveRequestsRepository: HrLeaveRequestsRepository,
    private readonly hrLeaveBalancesRepository: HrLeaveBalancesRepository,
    private readonly hrAttendanceRepository: HrAttendanceRepository,
    private readonly hrPayrollRepository: HrPayrollRepository,
    private readonly hrAnnouncementsRepository: HrAnnouncementsRepository,
    private readonly hrDocumentsRepository: HrDocumentsRepository,
    private readonly transactionManager: TransactionManager,
    private readonly userContextService: UserContextService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  private getOrganizationId(): string {
    const user = this.userContextService.getCurrentUser();
    return user?.organizationId;
  }

  private getCurrentUserId(): string {
    return this.userContextService.getCurrentUserId();
  }

  private getCurrentUserRole(): string {
    return this.userContextService.getCurrentUserRole();
  }

  private isAdminOrAbove(): boolean {
    const role = this.getCurrentUserRole();
    return ['SUPERADMIN', 'ADMIN', 'SUPPORT'].includes(role);
  }

  // ─── Departments ──────────────────────────────────────────

  async findAllDepartments(query: HrDepartmentQueryDto) {
    const where: WhereOptions<HrDepartment> = {};
    if (query.status) where.status = query.status;

    return this.hrDepartmentsRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['name'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findDepartmentById(id: string): Promise<HrDepartment> {
    const record = await this.hrDepartmentsRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Department with ID '${id}' not found`);
    return record as HrDepartment;
  }

  async createDepartment(dto: CreateHrDepartmentDto): Promise<HrDepartment> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrDepartmentsRepository.create(data as any, transaction);
    });
  }

  async updateDepartment(id: string, dto: UpdateHrDepartmentDto): Promise<HrDepartment> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrDepartmentsRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Department with ID '${id}' not found`);
      await this.hrDepartmentsRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrDepartmentsRepository.findById(id, transaction);
      return updated as HrDepartment;
    });
  }

  async deleteDepartment(id: string): Promise<HrDepartment> {
    const record = await this.findDepartmentById(id);
    if (!record.organizationId) {
      throw new BadRequestException('Default departments cannot be deleted');
    }
    await this.hrDepartmentsRepository.delete({ id });
    return record;
  }

  // ─── Designations ──────────────────────────────────────────

  async findAllDesignations(query: HrDesignationQueryDto) {
    const where: WhereOptions<HrDesignation> = {};
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;

    return this.hrDesignationsRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['name'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findDesignationById(id: string): Promise<HrDesignation> {
    const record = await this.hrDesignationsRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Designation with ID '${id}' not found`);
    return record as HrDesignation;
  }

  async createDesignation(dto: CreateHrDesignationDto): Promise<HrDesignation> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrDesignationsRepository.create(data as any, transaction);
    });
  }

  async updateDesignation(id: string, dto: UpdateHrDesignationDto): Promise<HrDesignation> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrDesignationsRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Designation with ID '${id}' not found`);
      await this.hrDesignationsRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrDesignationsRepository.findById(id, transaction);
      return updated as HrDesignation;
    });
  }

  async deleteDesignation(id: string): Promise<HrDesignation> {
    const record = await this.findDesignationById(id);
    if (!record.organizationId) {
      throw new BadRequestException('Default designations cannot be deleted');
    }
    await this.hrDesignationsRepository.delete({ id });
    return record;
  }

  // ─── Leave Types ──────────────────────────────────────────

  async findAllLeaveTypes(query: HrLeaveTypeQueryDto) {
    const where: WhereOptions<HrLeaveType> = {};
    if (query.status) where.status = query.status;

    return this.hrLeaveTypesRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['name'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findLeaveTypeById(id: string): Promise<HrLeaveType> {
    const record = await this.hrLeaveTypesRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Leave type with ID '${id}' not found`);
    return record as HrLeaveType;
  }

  async createLeaveType(dto: CreateHrLeaveTypeDto): Promise<HrLeaveType> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrLeaveTypesRepository.create(data as any, transaction);
    });
  }

  async updateLeaveType(id: string, dto: UpdateHrLeaveTypeDto): Promise<HrLeaveType> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrLeaveTypesRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Leave type with ID '${id}' not found`);
      await this.hrLeaveTypesRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrLeaveTypesRepository.findById(id, transaction);
      return updated as HrLeaveType;
    });
  }

  async deleteLeaveType(id: string): Promise<HrLeaveType> {
    const record = await this.findLeaveTypeById(id);
    if (!record.organizationId) {
      throw new BadRequestException('Default leave types cannot be deleted');
    }
    await this.hrLeaveTypesRepository.delete({ id });
    return record;
  }

  // ─── Leave Requests ──────────────────────────────────────────

  async findAllLeaveRequests(query: HrLeaveQueryDto) {
    const where: WhereOptions<HrLeaveRequest> = {};
    if (query.status) where.status = query.status;
    if (query.leaveTypeId) where.leaveTypeId = query.leaveTypeId;

    if (!this.isAdminOrAbove()) {
      where.userId = this.getCurrentUserId();
    } else if (query.userId) {
      where.userId = query.userId;
    }

    return this.hrLeaveRequestsRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['reason'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findLeaveRequestById(id: string): Promise<HrLeaveRequest> {
    const record = await this.hrLeaveRequestsRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Leave request with ID '${id}' not found`);
    return record as HrLeaveRequest;
  }

  async createLeaveRequest(dto: CreateHrLeaveRequestDto): Promise<HrLeaveRequest> {
    return this.transactionManager.execute(async (transaction) => {
      const data = {
        ...dto,
        organizationId: this.getOrganizationId(),
        userId: this.getCurrentUserId(),
      };
      return this.hrLeaveRequestsRepository.create(data as any, transaction);
    });
  }

  async updateLeaveRequest(id: string, dto: UpdateHrLeaveRequestDto): Promise<HrLeaveRequest> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrLeaveRequestsRepository.findById(id, transaction) as HrLeaveRequest;
      if (!existing) throw new NotFoundException(`Leave request with ID '${id}' not found`);

      const currentUserId = this.getCurrentUserId();
      const isAdmin = this.isAdminOrAbove();
      const isOwner = existing.userId === currentUserId;

      if (dto.status === HrLeaveRequestStatus.APPROVED || dto.status === HrLeaveRequestStatus.REJECTED) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can approve or reject leave requests');
        }
        if (isOwner) {
          throw new ForbiddenException('You cannot approve or reject your own leave request');
        }
      }

      if (!isAdmin && !isOwner) {
        throw new ForbiddenException('You can only update your own leave requests');
      }

      if (!isAdmin && dto.status && dto.status !== HrLeaveRequestStatus.CANCELLED) {
        throw new ForbiddenException('You can only cancel your own leave request');
      }

      const updateData: any = { ...dto };
      if (dto.status === HrLeaveRequestStatus.APPROVED) {
        updateData.approvedBy = currentUserId;
        updateData.approvedAt = new Date();
      }

      await this.hrLeaveRequestsRepository.update({ id }, updateData, transaction);
      const updated = await this.hrLeaveRequestsRepository.findById(id, transaction);
      return updated as HrLeaveRequest;
    });
  }

  async deleteLeaveRequest(id: string): Promise<HrLeaveRequest> {
    const record = await this.findLeaveRequestById(id);
    if (!this.isAdminOrAbove() && record.userId !== this.getCurrentUserId()) {
      throw new ForbiddenException('You can only delete your own leave requests');
    }
    await this.hrLeaveRequestsRepository.delete({ id });
    return record;
  }

  // ─── Leave Balances ──────────────────────────────────────────

  async findLeaveBalances(query: HrLeaveBalanceQueryDto) {
    const where: WhereOptions<HrLeaveBalance> = {};
    if (query.userId) where.userId = query.userId;
    if (query.leaveTypeId) where.leaveTypeId = query.leaveTypeId;
    if (query.year) where.year = query.year;

    return this.hrLeaveBalancesRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: [],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async createLeaveBalance(dto: CreateHrLeaveBalanceDto): Promise<HrLeaveBalance> {
    return this.transactionManager.execute(async (transaction) => {
      const totalDays = dto.totalDays ?? 0;
      const usedDays = dto.usedDays ?? 0;
      const remainingDays = dto.remainingDays ?? totalDays - usedDays;
      const data = {
        ...dto,
        organizationId: this.getOrganizationId(),
        totalDays,
        usedDays,
        remainingDays,
      };
      return this.hrLeaveBalancesRepository.create(data as any, transaction);
    });
  }

  // ─── Attendance ──────────────────────────────────────────

  async findAllAttendance(query: HrAttendanceQueryDto) {
    const where: WhereOptions<HrAttendance> = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;
    if (query.startDate && query.endDate) {
      where.date = { [Op.between]: [query.startDate, query.endDate] } as any;
    } else if (query.startDate) {
      where.date = { [Op.gte]: query.startDate } as any;
    } else if (query.endDate) {
      where.date = { [Op.lte]: query.endDate } as any;
    }

    return this.hrAttendanceRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['notes'],
        sortBy: 'date',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findAttendanceById(id: string): Promise<HrAttendance> {
    const record = await this.hrAttendanceRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Attendance with ID '${id}' not found`);
    return record as HrAttendance;
  }

  async createAttendance(dto: CreateHrAttendanceDto): Promise<HrAttendance> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrAttendanceRepository.create(data as any, transaction);
    });
  }

  async updateAttendance(id: string, dto: UpdateHrAttendanceDto): Promise<HrAttendance> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrAttendanceRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Attendance with ID '${id}' not found`);
      await this.hrAttendanceRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrAttendanceRepository.findById(id, transaction);
      return updated as HrAttendance;
    });
  }

  async deleteAttendance(id: string): Promise<HrAttendance> {
    const record = await this.findAttendanceById(id);
    await this.hrAttendanceRepository.delete({ id });
    return record;
  }

  // ─── Payroll ──────────────────────────────────────────

  async findAllPayroll(query: HrPayrollQueryDto) {
    const where: WhereOptions<HrPayroll> = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;

    return this.hrPayrollRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: [],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findPayrollById(id: string): Promise<HrPayroll> {
    const record = await this.hrPayrollRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Payroll with ID '${id}' not found`);
    return record as HrPayroll;
  }

  async createPayroll(dto: CreateHrPayrollDto): Promise<HrPayroll> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrPayrollRepository.create(data as any, transaction);
    });
  }

  async updatePayroll(id: string, dto: UpdateHrPayrollDto): Promise<HrPayroll> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrPayrollRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Payroll with ID '${id}' not found`);
      await this.hrPayrollRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrPayrollRepository.findById(id, transaction);
      return updated as HrPayroll;
    });
  }

  async deletePayroll(id: string): Promise<HrPayroll> {
    const record = await this.findPayrollById(id);
    await this.hrPayrollRepository.delete({ id });
    return record;
  }

  // ─── Announcements ──────────────────────────────────────────

  async findAllAnnouncements(query: HrAnnouncementQueryDto) {
    const where: WhereOptions<HrAnnouncement> = {};
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.status) where.status = query.status;

    return this.hrAnnouncementsRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['title', 'content'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findAnnouncementById(id: string): Promise<HrAnnouncement> {
    const record = await this.hrAnnouncementsRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Announcement with ID '${id}' not found`);
    return record as HrAnnouncement;
  }

  async createAnnouncement(dto: CreateHrAnnouncementDto): Promise<HrAnnouncement> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrAnnouncementsRepository.create(data as any, transaction);
    });
  }

  async updateAnnouncement(id: string, dto: UpdateHrAnnouncementDto): Promise<HrAnnouncement> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrAnnouncementsRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Announcement with ID '${id}' not found`);
      await this.hrAnnouncementsRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrAnnouncementsRepository.findById(id, transaction);
      return updated as HrAnnouncement;
    });
  }

  async deleteAnnouncement(id: string): Promise<HrAnnouncement> {
    const record = await this.findAnnouncementById(id);
    await this.hrAnnouncementsRepository.delete({ id });
    return record;
  }

  // ─── Documents ──────────────────────────────────────────

  async findAllDocuments(query: HrDocumentQueryDto) {
    const where: WhereOptions<HrDocument> = {};
    if (query.documentType) where.documentType = query.documentType;
    if (query.status) where.status = query.status;

    if (!this.isAdminOrAbove()) {
      (where as any)[Op.or] = [
        { userId: this.getCurrentUserId() },
        { isPublic: true },
      ];
    } else if (query.userId) {
      where.userId = query.userId;
    }

    return this.hrDocumentsRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.search || query.searchTerm || '',
        searchFields: ['title'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      organizationId: query.organizationId,
    });
  }

  async findDocumentById(id: string): Promise<HrDocument> {
    const record = await this.hrDocumentsRepository.findOne({ where: { id } as any });
    if (!record) throw new NotFoundException(`Document with ID '${id}' not found`);
    return record as HrDocument;
  }

  async createDocument(dto: CreateHrDocumentDto): Promise<HrDocument> {
    return this.transactionManager.execute(async (transaction) => {
      const data = { ...dto, organizationId: this.getOrganizationId() };
      return this.hrDocumentsRepository.create(data as any, transaction);
    });
  }

  async updateDocument(id: string, dto: UpdateHrDocumentDto): Promise<HrDocument> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.hrDocumentsRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Document with ID '${id}' not found`);
      await this.hrDocumentsRepository.update({ id }, dto as any, transaction);
      const updated = await this.hrDocumentsRepository.findById(id, transaction);
      return updated as HrDocument;
    });
  }

  async deleteDocument(id: string): Promise<HrDocument> {
    if (!this.isAdminOrAbove()) {
      throw new ForbiddenException('Only admins can delete documents');
    }
    const record = await this.findDocumentById(id);
    await this.hrDocumentsRepository.delete({ id });
    return record;
  }

  // ─── Dashboard ──────────────────────────────────────────

  async getDashboardStats(organizationId?: string) {
    const orgId = organizationId || this.getOrganizationId();

    const [departmentsResult, pendingLeaveResult, attendanceResult, announcementsResult, usersCount] =
      await Promise.all([
        this.hrDepartmentsRepository.findAll({
          where: {},
          pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
          organizationId: orgId,
        }),
        this.hrLeaveRequestsRepository.findAll({
          where: { status: HrLeaveRequestStatus.PENDING },
          pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
          organizationId: orgId,
        }),
        this.hrAttendanceRepository.findAll({
          where: { date: new Date().toISOString().split('T')[0] } as any,
          pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [], sortBy: 'date', sortOrder: 'DESC' },
          organizationId: orgId,
        }),
        this.hrAnnouncementsRepository.findAll({
          where: { status: HrAnnouncementStatus.PUBLISHED },
          pagination: { page: 1, limit: 1, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
          organizationId: orgId,
        }),
        orgId
          ? this.userModel.count({ where: { organizationId: orgId } })
          : Promise.resolve(0),
      ]);

    return {
      totalDepartments: departmentsResult.total,
      totalUsers: usersCount,
      pendingLeaveRequests: pendingLeaveResult.total,
      todaysAttendanceCount: attendanceResult.total,
      activeAnnouncements: announcementsResult.total,
    };
  }
}
