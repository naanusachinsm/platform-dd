import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../project.repository';
import { ProjectMemberRepository } from '../project-member.repository';
import { TicketRepository } from '../ticket.repository';
import { BoardColumnService } from './board-column.service';
import { ProjectActivityService } from './project-activity.service';
import { Project } from '../entities/project.entity';
import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
import { ProjectActivityAction, ProjectEntityType } from '../entities/project-activity.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';
import { AddProjectMemberDto } from '../dto/add-project-member.dto';
import { UserRole } from 'src/common/enums/roles.enum';
import { Op } from 'sequelize';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly boardColumnService: BoardColumnService,
    private readonly activityService: ProjectActivityService,
    private readonly userContextService: UserContextService,
    private readonly transactionManager: TransactionManager,
  ) {}

  async create(dto: CreateProjectDto) {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;

    const existing = await this.projectRepository.findOne({
      where: { organizationId, key: dto.key } as any,
    });
    if (existing) {
      throw new BadRequestException(`Project key "${dto.key}" already exists in this organization`);
    }

    return this.transactionManager.execute(async (transaction) => {
      await this.boardColumnService.ensureDefaultColumns(organizationId);

      const project = await this.projectRepository.create(
        { ...dto, organizationId } as any,
        transaction,
      );

      await this.projectMemberRepository.create(
        {
          projectId: (project as any).id,
          userId: user?.sub,
          role: ProjectMemberRole.ADMIN,
        } as any,
        transaction,
      );

      return project;
    });
  }

  async findAll(query: ProjectQueryDto) {
    const user = this.userContextService.getCurrentUser();
    const where: any = {};
    if (query.status) where.status = query.status;

    if (user?.role === UserRole.USER) {
      const memberEntries = await ProjectMember.findAll({
        where: { userId: user.sub },
        attributes: ['projectId'],
        raw: true,
      });
      const projectIds = memberEntries.map((m) => m.projectId);
      where.id = { [Op.in]: projectIds };
    }

    return this.projectRepository.findAll({
      where,
      pagination: {
        page: query.page,
        limit: query.limit,
        searchTerm: query.searchTerm,
        searchFields: ['name', 'key', 'description'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: User, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: ProjectMember, as: 'members', attributes: ['id'] },
      ],
      organizationId: query.organizationId,
    });
  }

  async findOne(id: string) {
    const project = await this.projectRepository.findOne({
      where: { id } as any,
      include: [
        { model: User, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        {
          model: ProjectMember,
          as: 'members',
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] }],
        },
      ],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findByKey(key: string) {
    const user = this.userContextService.getCurrentUser();
    const project = await this.projectRepository.findOne({
      where: { key, organizationId: user?.organizationId } as any,
      include: [
        { model: User, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
      ],
    });
    if (!project) throw new NotFoundException('Project not found');

    if (user?.role !== UserRole.SUPERADMIN) {
      const member = await this.projectMemberRepository.findOne({
        where: { projectId: (project as any).id, userId: user?.sub } as any,
      });
      if (!member) throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException('Project not found');

    await this.projectRepository.update({ id } as any, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException('Project not found');

    return this.projectRepository.delete({ id } as any);
  }

  async getMembers(projectId: string) {
    return this.projectMemberRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 200, sortBy: 'createdAt', sortOrder: 'ASC' },
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
      ],
    });
  }

  async addMember(projectId: string, dto: AddProjectMemberDto) {
    return this.transactionManager.execute(async (transaction) => {
      const project = await this.projectRepository.findById(projectId, transaction) as any;
      if (!project) throw new NotFoundException('Project not found');

      const targetUser = await User.findByPk(dto.userId, { attributes: ['id', 'organizationId'], transaction });
      if (!targetUser) throw new NotFoundException('User not found');
      if (targetUser.organizationId !== project.organizationId) {
        throw new BadRequestException('User does not belong to this organization');
      }

      const existing = await this.projectMemberRepository.findOne({
        where: { projectId, userId: dto.userId } as any,
      });
      if (existing) throw new BadRequestException('User is already a member of this project');

      return this.projectMemberRepository.create({
        projectId,
        userId: dto.userId,
        role: dto.role || ProjectMemberRole.MEMBER,
      } as any, transaction);
    });
  }

  async removeMember(projectId: string, userId: string) {
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId } as any,
    }) as any;
    if (!member) throw new NotFoundException('Member not found in this project');

    if (member.role === ProjectMemberRole.ADMIN) {
      const admins = await this.projectMemberRepository.findAll({
        where: { projectId, role: ProjectMemberRole.ADMIN } as any,
        pagination: { page: 1, limit: 2 },
      });
      if (admins.total <= 1) {
        throw new BadRequestException('Cannot remove the last admin from the project');
      }
    }

    return this.transactionManager.execute(async (transaction) => {
      const unassignedCount = await this.ticketRepository.update(
        { projectId, assigneeId: userId } as any,
        { assigneeId: null } as any,
        transaction,
        undefined,
        true,
      );

      await this.projectMemberRepository.delete(
        { projectId, userId } as any,
        transaction,
      );

      this.activityService.log(
        projectId,
        ProjectActivityAction.DELETE,
        ProjectEntityType.MEMBER,
        `Member removed. ${unassignedCount} ticket(s) unassigned.`,
        userId,
      ).catch(() => {});

      return { removed: true, ticketsUnassigned: unassignedCount };
    });
  }

  async incrementTicketSequence(projectId: string, transaction?: any): Promise<number> {
    const project = await this.projectRepository.findById(projectId, transaction) as any;
    if (!project) throw new NotFoundException('Project not found');

    const newSequence = (project.ticketSequence || 0) + 1;
    await this.projectRepository.update(
      { id: projectId } as any,
      { ticketSequence: newSequence } as any,
      transaction,
    );
    return newSequence;
  }
}
