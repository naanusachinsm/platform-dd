import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TicketRepository } from '../ticket.repository';
import { SprintRepository } from '../sprint.repository';
import { BoardRepository } from '../board.repository';
import { ProjectMemberRepository } from '../project-member.repository';
import { ProjectService } from './project.service';
import { BoardColumnService } from './board-column.service';
import { Ticket, TicketType, TicketResolution } from '../entities/ticket.entity';
import { BoardColumn } from '../entities/board-column.entity';
import { Sprint } from '../entities/sprint.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { Project } from '../entities/project.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketQueryDto } from '../dto/ticket-query.dto';
import { MoveTicketDto, AssignTicketDto } from '../dto/move-ticket.dto';
import { ProjectActivityService } from './project-activity.service';
import { ProjectActivityAction, ProjectEntityType } from '../entities/project-activity.entity';
import { TicketNotificationService } from './ticket-notification.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectModel(Ticket)
    private readonly ticketModel: typeof Ticket,
    private readonly ticketRepository: TicketRepository,
    private readonly sprintRepository: SprintRepository,
    private readonly boardRepository: BoardRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly projectService: ProjectService,
    private readonly boardColumnService: BoardColumnService,
    private readonly userContextService: UserContextService,
    private readonly transactionManager: TransactionManager,
    private readonly projectActivityService: ProjectActivityService,
    private readonly ticketNotificationService: TicketNotificationService,
  ) {}

  async create(projectId: string, dto: CreateTicketDto) {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;

    await this.validateAssigneeMembership(projectId, dto.assigneeId);

    return this.transactionManager.execute(async (transaction) => {
      const project = await this.projectService.findOne(projectId) as any;

      if (!dto.columnId) {
        const columns = await this.boardColumnService.findAll(organizationId);
        const todoColumn = columns.data.find((c: any) => c.name === 'Todo' && c.isDefault);
        if (!todoColumn) throw new BadRequestException('No default Todo column found');
        dto.columnId = (todoColumn as any).id;
      }

      const ticketNumber = await this.projectService.incrementTicketSequence(projectId, transaction);
      const ticketKey = `${project.key}-${ticketNumber}`;

      const maxPosition = await this.getMaxPositionInColumn(dto.columnId);

      const ticket = await this.ticketRepository.create(
        {
          ...dto,
          projectId,
          organizationId,
          ticketKey,
          ticketNumber,
          reporterId: user?.sub,
          position: maxPosition + 1,
        } as any,
        transaction,
      );

      const parts = [`type: ${dto.type ?? 'TASK'}`, `priority: ${dto.priority ?? 'MEDIUM'}`];
      if (dto.sprintId) {
        try {
          const sprint = await this.sprintRepository.findById(dto.sprintId, transaction) as any;
          parts.push(`sprint: "${sprint?.name ?? 'Unknown'}"`);
        } catch { parts.push('sprint assigned'); }
      }
      this.projectActivityService.log(projectId, ProjectActivityAction.CREATE, ProjectEntityType.TICKET, `Created ${ticketKey}: ${dto.title} (${parts.join(', ')})`, (ticket as any).id, { ticketKey });

      this.ticketNotificationService.notifyTicketCreated(
        projectId, project.key, ticketKey, dto.title,
        dto.type ?? 'TASK', dto.priority ?? 'MEDIUM',
      ).catch(() => {});

      return ticket;
    });
  }

  async findAll(projectId: string, query: TicketQueryDto) {
    const where: any = { projectId };
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.sprintId) where.sprintId = query.sprintId;
    if (query.columnId) where.columnId = query.columnId;

    return this.ticketRepository.findAll({
      where,
      pagination: {
        page: query.page,
        limit: query.limit,
        searchTerm: query.searchTerm,
        searchFields: ['title', 'ticketKey'],
        sortBy: 'position',
        sortOrder: 'ASC',
      },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name', 'position'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: Ticket, as: 'parent', attributes: ['id', 'ticketKey', 'title'] },
      ],
    });
  }

  private async ensureTicketInProject(id: string, projectId: string) {
    const ticket = await this.ticketRepository.findById(id) as any;
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.projectId !== projectId) throw new NotFoundException('Ticket not found in this project');
    return ticket;
  }

  private async validateAssigneeMembership(projectId: string, assigneeId?: string) {
    if (!assigneeId) return;
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId: assigneeId } as any,
    });
    if (!member) throw new BadRequestException('Assignee is not a member of this project');
  }

  async findOne(projectId: string, id: string) {
    await this.ensureTicketInProject(id, projectId);
    const ticket = await this.ticketRepository.findOne({
      where: { id } as any,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name', 'position'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'key'] },
        { model: Ticket, as: 'parent', attributes: ['id', 'ticketKey', 'title'] },
        { model: Ticket, as: 'children', attributes: ['id', 'ticketKey', 'title', 'type', 'priority', 'columnId', 'assigneeId'] },
      ],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async findByKey(projectId: string, ticketNumber: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { projectId, ticketNumber } as any,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name', 'position'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'key'] },
        { model: Ticket, as: 'parent', attributes: ['id', 'ticketKey', 'title'] },
        { model: Ticket, as: 'children', attributes: ['id', 'ticketKey', 'title', 'type', 'priority', 'columnId', 'assigneeId'] },
      ],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(projectId: string, id: string, dto: UpdateTicketDto) {
    const ticket = await this.ensureTicketInProject(id, projectId);

    await this.validateAssigneeMembership(projectId, dto.assigneeId);

    if (ticket.type === TicketType.EPIC && dto.resolution === TicketResolution.DONE) {
      await this.validateEpicCanClose(id, ticket.ticketKey);
    }

    await this.ticketRepository.update({ id } as any, dto as any);

    const changeParts: string[] = [];
    if (dto.title && dto.title !== ticket.title) changeParts.push(`title → "${dto.title}"`);
    if (dto.type && dto.type !== ticket.type) changeParts.push(`type → ${dto.type}`);
    if (dto.priority && dto.priority !== ticket.priority) changeParts.push(`priority → ${dto.priority}`);
    if (dto.resolution && dto.resolution !== ticket.resolution) changeParts.push(`resolution → ${dto.resolution}`);
    if (dto.storyPoints !== undefined && dto.storyPoints !== ticket.storyPoints) changeParts.push(`story points → ${dto.storyPoints}`);
    if (dto.dueDate !== undefined) changeParts.push(`due date → ${dto.dueDate || 'none'}`);
    if (dto.description !== undefined && dto.description !== ticket.description) changeParts.push('description updated');

    if (dto.sprintId !== undefined && dto.sprintId !== ticket.sprintId) {
      if (dto.sprintId) {
        try {
          const sprint = await this.sprintRepository.findById(dto.sprintId) as any;
          changeParts.push(`added to sprint "${sprint?.name ?? dto.sprintId}"`);
        } catch { changeParts.push('moved to sprint'); }
      } else {
        changeParts.push('moved to backlog');
      }
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== ticket.assigneeId) {
      if (dto.assigneeId) {
        const updated = await this.findOne(projectId, id) as any;
        const name = updated?.assignee ? `${updated.assignee.firstName ?? ''} ${updated.assignee.lastName ?? ''}`.trim() : dto.assigneeId;
        changeParts.push(`assigned to ${name}`);
      } else {
        changeParts.push('unassigned');
      }
    }

    if (dto.parentId !== undefined && dto.parentId !== ticket.parentId) {
      if (dto.parentId) {
        try {
          const parent = await this.ticketRepository.findById(dto.parentId) as any;
          changeParts.push(`linked to epic ${parent?.ticketKey ?? dto.parentId}`);
        } catch { changeParts.push('linked to epic'); }
      } else {
        changeParts.push('unlinked from epic');
      }
    }

    if (changeParts.length > 0) {
      const desc = `Updated ${ticket.ticketKey}: ${changeParts.join(', ')}`;
      this.projectActivityService.log(ticket.projectId, ProjectActivityAction.UPDATE, ProjectEntityType.TICKET, desc, id, { changes: changeParts });

      const projectKey = ticket.ticketKey.split('-')[0];
      this.ticketNotificationService.notifyTicketUpdated(
        ticket.projectId, projectKey, ticket.ticketKey, ticket.title, changeParts,
      ).catch(() => {});
    }

    return this.findOne(projectId, id);
  }

  async remove(projectId: string, id: string) {
    const ticket = await this.ensureTicketInProject(id, projectId);

    this.projectActivityService.log(ticket.projectId, ProjectActivityAction.DELETE, ProjectEntityType.TICKET, `Deleted ${ticket.ticketKey}: ${ticket.title}`, id);

    const projectKey = ticket.ticketKey.split('-')[0];
    this.ticketNotificationService.notifyTicketDeleted(
      ticket.projectId, projectKey, ticket.ticketKey, ticket.title,
    ).catch(() => {});

    return this.ticketRepository.delete({ id } as any);
  }

  async moveTicket(projectId: string, id: string, dto: MoveTicketDto) {
    const ticket = await this.ensureTicketInProject(id, projectId);

    const user = this.userContextService.getCurrentUser();
    const allColumns = await this.boardColumnService.findAll(user?.organizationId);
    const sorted = [...allColumns.data].sort((a: any, b: any) => a.position - b.position);
    const lastColumn = sorted[sorted.length - 1] as any;
    const isDoneColumn = lastColumn && lastColumn.id === dto.columnId;

    if (isDoneColumn && (ticket as any).type === TicketType.EPIC) {
      await this.validateEpicCanClose(id, (ticket as any).ticketKey);
    }

    const updateData: any = { columnId: dto.columnId, position: dto.position };
    if (isDoneColumn) {
      updateData.resolution = TicketResolution.DONE;
    } else if ((ticket as any).resolution === TicketResolution.DONE) {
      updateData.resolution = TicketResolution.UNRESOLVED;
    }

    await this.ticketRepository.update({ id } as any, updateData);
    const targetCol = allColumns.data.find((c: any) => c.id === dto.columnId) as any;
    const sourceCol = allColumns.data.find((c: any) => c.id === (ticket as any).columnId) as any;
    const fromName = sourceCol?.name ?? 'Unknown';
    const toName = targetCol?.name ?? 'column';
    this.projectActivityService.log((ticket as any).projectId, ProjectActivityAction.UPDATE, ProjectEntityType.TICKET, `Moved ${(ticket as any).ticketKey} from "${fromName}" to "${toName}"`, id, { from: fromName, to: toName });

    const projectKey = (ticket as any).ticketKey.split('-')[0];
    this.ticketNotificationService.notifyTicketMoved(
      (ticket as any).projectId, projectKey, (ticket as any).ticketKey, (ticket as any).title,
      fromName, toName,
    ).catch(() => {});

    return this.findOne(projectId, id);
  }

  async assignTicket(projectId: string, id: string, dto: AssignTicketDto) {
    const ticket = await this.ensureTicketInProject(id, projectId);

    await this.validateAssigneeMembership(projectId, dto.assigneeId);

    await this.ticketRepository.update(
      { id } as any,
      { assigneeId: dto.assigneeId || null } as any,
    );

    const updated = await this.findOne(projectId, id) as any;
    let desc: string;
    if (dto.assigneeId) {
      const name = updated?.assignee ? `${updated.assignee.firstName ?? ''} ${updated.assignee.lastName ?? ''}`.trim() : 'a member';
      desc = `Assigned ${ticket.ticketKey} to ${name}`;
    } else {
      desc = `Unassigned ${ticket.ticketKey}`;
    }
    this.projectActivityService.log(ticket.projectId, ProjectActivityAction.UPDATE, ProjectEntityType.TICKET, desc, id);

    const projectKey = ticket.ticketKey.split('-')[0];
    const assigneeName = dto.assigneeId && updated?.assignee
      ? `${updated.assignee.firstName ?? ''} ${updated.assignee.lastName ?? ''}`.trim()
      : null;
    this.ticketNotificationService.notifyTicketAssigned(
      ticket.projectId, projectKey, ticket.ticketKey, ticket.title, assigneeName,
    ).catch(() => {});

    return updated;
  }

  async getBoardData(projectId: string, filters?: {
    filterSprintId?: string;
    filterType?: string;
    filterPriority?: string;
    filterAssigneeId?: string;
    filterLabels?: string[];
  }) {
    const user = this.userContextService.getCurrentUser();
    const columns = await this.boardColumnService.findAll(user?.organizationId);

    const where: any = { projectId };
    if (filters?.filterSprintId) where.sprintId = filters.filterSprintId;
    if (filters?.filterType) where.type = filters.filterType;
    if (filters?.filterPriority) where.priority = filters.filterPriority;
    if (filters?.filterAssigneeId) where.assigneeId = filters.filterAssigneeId;

    const tickets = await this.ticketRepository.findAll({
      where,
      pagination: { page: 1, limit: 1000, sortBy: 'position', sortOrder: 'ASC' },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: Ticket, as: 'parent', attributes: ['id', 'ticketKey', 'title'] },
      ],
    });

    let ticketData = tickets.data as any[];
    if (filters?.filterLabels?.length) {
      ticketData = ticketData.filter((t: any) =>
        t.labels?.some((l: string) => filters.filterLabels!.includes(l))
      );
    }

    const columnMap = new Map<string, any[]>();
    for (const col of columns.data as any[]) {
      columnMap.set(col.id, []);
    }
    for (const ticket of ticketData) {
      const colTickets = columnMap.get(ticket.columnId);
      if (colTickets) colTickets.push(ticket);
    }

    return {
      columns: (columns.data as any[]).map((col) => ({
        ...col,
        tickets: columnMap.get(col.id) || [],
      })),
    };
  }

  async getBacklogData(projectId: string) {
    const backlogTickets = await this.ticketRepository.findAll({
      where: { projectId, sprintId: null } as any,
      pagination: { page: 1, limit: 1000, sortBy: 'position', sortOrder: 'ASC' },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name'] },
        { model: Ticket, as: 'parent', attributes: ['id', 'ticketKey', 'title'] },
      ],
    });

    return {
      backlog: backlogTickets.data,
      totalBacklog: backlogTickets.total,
    };
  }

  async getProjectSummary(projectId: string) {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const columns = await this.boardColumnService.findAll(organizationId);
    const doneColumn = (columns.data as any[]).find(
      (c: any) => c.name.toLowerCase() === 'done' && c.isDefault,
    );

    const [createdRes, updatedRes, completedCount, dueCount, totalTicketsRes, columnCounts, recentRes] =
      await Promise.all([
        this.ticketRepository.findAll({
          where: { projectId, createdAt: { [Op.gte]: sevenDaysAgo } } as any,
          pagination: { page: 1, limit: 1 },
        }),
        this.ticketRepository.findAll({
          where: { projectId, updatedAt: { [Op.gte]: sevenDaysAgo } } as any,
          pagination: { page: 1, limit: 1 },
        }),
        doneColumn
          ? this.ticketRepository.findAll({
              where: {
                projectId,
                columnId: doneColumn.id,
                updatedAt: { [Op.gte]: sevenDaysAgo },
              } as any,
              pagination: { page: 1, limit: 1 },
            })
          : Promise.resolve({ total: 0 }),
        this.ticketRepository.findAll({
          where: {
            projectId,
            dueDate: { [Op.between]: [now, sevenDaysFromNow] },
          } as any,
          pagination: { page: 1, limit: 1 },
        }),
        this.ticketRepository.findAll({
          where: { projectId } as any,
          pagination: { page: 1, limit: 1 },
        }),
        this.ticketModel.count({
          where: { projectId, deletedAt: null },
          include: [{ model: BoardColumn, as: 'column', attributes: ['id', 'name'] }],
          group: ['column.id', 'column.name'],
        } as any) as Promise<any[]>,
        this.ticketRepository.findAll({
          where: { projectId } as any,
          pagination: { page: 1, limit: 10, sortBy: 'updatedAt', sortOrder: 'DESC' },
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
            { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
            { model: BoardColumn, as: 'column', attributes: ['id', 'name'] },
            { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
          ],
        }),
      ]);

    const statusDistribution = (columnCounts || []).map((row: any) => ({
      status: row['column.name'] ?? row.name ?? 'Unknown',
      count: parseInt(row.count, 10),
    }));

    const [
      sprintsRes, activeSprintsRes, completedSprintsRes,
      boardsRes,
      membersRes,
    ] = await Promise.all([
      this.sprintRepository.findAll({
        where: { projectId } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
      }),
      this.sprintRepository.findAll({
        where: { projectId, status: 'ACTIVE' } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
      }),
      this.sprintRepository.findAll({
        where: { projectId, status: 'COMPLETED' } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
      }),
      this.boardRepository.findAll({
        where: { projectId } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
      }),
      this.projectMemberRepository.findAll({
        where: { projectId } as any,
        pagination: { page: 1, limit: 1000 },
        bypassTenantFilter: true,
        include: [
          { model: User, attributes: ['id', 'status'] },
        ],
      }),
    ]);

    const allMembers = membersRes.data as any[];
    const activeMembers = allMembers.filter((m) => m.user?.status === 'ACTIVE').length;
    const inactiveMembers = allMembers.length - activeMembers;

    return {
      totalTickets: totalTicketsRes.total,
      statusDistribution,
      totalSprints: sprintsRes.total,
      activeSprints: activeSprintsRes.total,
      completedSprints: completedSprintsRes.total,
      totalBoards: boardsRes.total,
      totalMembers: membersRes.total,
      activeMembers,
      inactiveMembers,
      recentActivity: recentRes.data,
    };
  }

  private async validateEpicCanClose(epicId: string, epicKey: string) {
    const children = await this.ticketRepository.findAll({
      where: { parentId: epicId } as any,
      pagination: { page: 1, limit: 1000 },
      bypassTenantFilter: true,
    });

    const incomplete = (children.data as any[]).filter(
      (c) => c.resolution !== TicketResolution.DONE,
    );

    if (incomplete.length > 0) {
      const keys = incomplete.slice(0, 5).map((c) => c.ticketKey).join(', ');
      const suffix = incomplete.length > 5 ? ` and ${incomplete.length - 5} more` : '';
      throw new BadRequestException(
        `Cannot close epic ${epicKey}. ${incomplete.length} child issue(s) are not completed: ${keys}${suffix}`,
      );
    }
  }

  private async getMaxPositionInColumn(columnId: string): Promise<number> {
    const tickets = await this.ticketRepository.findAll({
      where: { columnId } as any,
      pagination: { page: 1, limit: 1, sortBy: 'position', sortOrder: 'DESC' },
      bypassTenantFilter: true,
    });

    if (tickets.data.length === 0) return -1;
    return (tickets.data[0] as any).position || 0;
  }
}
