import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SprintRepository } from '../sprint.repository';
import { TicketRepository } from '../ticket.repository';
import { Sprint, SprintStatus } from '../entities/sprint.entity';
import { TicketResolution } from '../entities/ticket.entity';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { CreateSprintDto, UpdateSprintDto } from '../dto/create-sprint.dto';
import { ProjectActivityService } from './project-activity.service';
import { ProjectActivityAction, ProjectEntityType } from '../entities/project-activity.entity';

@Injectable()
export class SprintService {
  private readonly logger = new Logger(SprintService.name);

  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly transactionManager: TransactionManager,
    private readonly userContextService: UserContextService,
    private readonly projectActivityService: ProjectActivityService,
  ) {}

  private async ensureSprintInProject(id: string, projectId: string) {
    const sprint = await this.sprintRepository.findById(id) as any;
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (sprint.projectId !== projectId) throw new NotFoundException('Sprint not found in this project');
    return sprint;
  }

  async findAll(projectId: string) {
    return this.sprintRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'DESC' },
      bypassTenantFilter: true,
    });
  }

  async create(projectId: string, dto: CreateSprintDto) {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.sprintRepository.findAll({
        where: { projectId, name: dto.name } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
        transaction,
      });
      if (existing.data.length > 0) {
        throw new BadRequestException(`A sprint with the name "${dto.name}" already exists in this project`);
      }

      const sprint = await this.sprintRepository.create({
        ...dto,
        projectId,
        status: SprintStatus.PLANNING,
      } as any, transaction);
      this.projectActivityService.log(projectId, ProjectActivityAction.CREATE, ProjectEntityType.SPRINT, `Created sprint "${dto.name}"`, (sprint as any).id);
      return sprint;
    });
  }

  async update(projectId: string, id: string, dto: UpdateSprintDto) {
    const sprint = await this.ensureSprintInProject(id, projectId);

    const changes = Object.keys(dto);
    await this.sprintRepository.update({ id } as any, dto as any);

    if (changes.length > 0) {
      const summary = changes.join(', ');
      this.projectActivityService.log(sprint.projectId, ProjectActivityAction.UPDATE, ProjectEntityType.SPRINT, `Updated sprint "${sprint.name}" (${summary})`, id, { fields: changes });
    }

    return this.sprintRepository.findById(id);
  }

  async start(projectId: string, id: string) {
    return this.transactionManager.execute(async (transaction) => {
      const sprint = await this.sprintRepository.findById(id, transaction) as any;
      if (!sprint) throw new NotFoundException('Sprint not found');
      if (sprint.projectId !== projectId) throw new NotFoundException('Sprint not found in this project');
      if (sprint.status !== SprintStatus.PLANNING) {
        throw new BadRequestException('Only sprints in PLANNING status can be started');
      }

      const sprintTickets = await this.ticketRepository.findAll({
        where: { sprintId: id } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
        transaction,
      });
      if (sprintTickets.total === 0) {
        throw new BadRequestException('Cannot start a sprint with no tickets. Add tickets to the sprint first.');
      }

      const activeSprints = await this.sprintRepository.findAll({
        where: { projectId, status: SprintStatus.ACTIVE } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
        transaction,
      });
      if (activeSprints.data.length > 0) {
        throw new BadRequestException('Only one active sprint allowed per project. Complete the current sprint first.');
      }

      await this.sprintRepository.update(
        { id } as any,
        { status: SprintStatus.ACTIVE } as any,
        transaction,
      );
      this.projectActivityService.log(projectId, ProjectActivityAction.UPDATE, ProjectEntityType.SPRINT, `Started sprint "${sprint.name}" with ${sprintTickets.total} tickets`, id);
      return this.sprintRepository.findById(id, transaction);
    });
  }

  async complete(projectId: string, id: string) {
    return this.transactionManager.execute(async (transaction) => {
      const sprint = await this.sprintRepository.findById(id, transaction) as any;
      if (!sprint) throw new NotFoundException('Sprint not found');
      if (sprint.projectId !== projectId) throw new NotFoundException('Sprint not found in this project');
      if (sprint.status !== SprintStatus.ACTIVE) {
        throw new BadRequestException('Only active sprints can be completed');
      }

      const allTickets = await this.ticketRepository.findAll({
        where: { sprintId: id } as any,
        pagination: { page: 1, limit: 1 },
        bypassTenantFilter: true,
        transaction,
      });
      const totalTickets = allTickets.total;

      const movedToBacklog = await this.ticketRepository.update(
        { sprintId: id, resolution: TicketResolution.UNRESOLVED } as any,
        { sprintId: null } as any,
        transaction,
        undefined,
        true,
      );

      const doneCount = totalTickets - movedToBacklog;

      await this.sprintRepository.update(
        { id } as any,
        { status: SprintStatus.COMPLETED } as any,
        transaction,
      );

      const completedSprint = await this.sprintRepository.findById(id, transaction);

      this.projectActivityService.log(projectId, ProjectActivityAction.UPDATE, ProjectEntityType.SPRINT, `Completed sprint "${sprint.name}" — ${doneCount} done, ${movedToBacklog} moved to backlog`, id, { done: doneCount, movedToBacklog });

      return {
        sprint: completedSprint,
        summary: {
          total: totalTickets,
          done: doneCount,
          movedToBacklog,
        },
      };
    });
  }

  async remove(projectId: string, id: string) {
    const sprint = await this.ensureSprintInProject(id, projectId);
    if (sprint.status === SprintStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active sprint. Complete it first.');
    }

    this.projectActivityService.log(sprint.projectId, ProjectActivityAction.DELETE, ProjectEntityType.SPRINT, `Deleted sprint "${sprint.name}"`, id);
    return this.sprintRepository.delete({ id } as any);
  }
}
