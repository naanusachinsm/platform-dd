import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BoardRepository } from '../board.repository';
import { UserContextService } from 'src/common/services/user-context.service';
import { CreateBoardDto, UpdateBoardDto } from '../dto/create-board.dto';
import { ProjectActivityService } from './project-activity.service';
import { ProjectActivityAction, ProjectEntityType } from '../entities/project-activity.entity';
import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
import { UserRole } from 'src/common/enums/roles.enum';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly userContextService: UserContextService,
    private readonly projectActivityService: ProjectActivityService,
    @InjectModel(ProjectMember)
    private readonly projectMemberModel: typeof ProjectMember,
  ) {}

  async findAll(projectId: string) {
    const user = this.userContextService.getCurrentUser();
    const where: any = { projectId };

    if (user?.role !== UserRole.SUPERADMIN) {
      const member = await this.projectMemberModel.findOne({
        where: { projectId, userId: user?.sub, deletedAt: null },
        attributes: ['role'],
      });

      if (member?.role !== ProjectMemberRole.ADMIN) {
        where.createdBy = user?.sub;
      }
    }

    return this.boardRepository.findAll({
      where,
      pagination: { page: 1, limit: 100, sortBy: 'position', sortOrder: 'ASC' },
      bypassTenantFilter: true,
    });
  }

  private async ensureBoardInProject(id: string, projectId: string) {
    const board = await this.boardRepository.findById(id) as any;
    if (!board) throw new NotFoundException('Board not found');
    if (board.projectId !== projectId) throw new NotFoundException('Board not found in this project');
    return board;
  }

  async findOne(projectId: string, id: string) {
    await this.ensureBoardInProject(id, projectId);
    const board = await this.boardRepository.findById(id);
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async create(projectId: string, dto: CreateBoardDto) {
    const user = this.userContextService.getCurrentUser();

    const existing = await this.boardRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 100 },
      bypassTenantFilter: true,
    });

    const maxPosition = existing.data.reduce(
      (max: number, b: any) => Math.max(max, b.position || 0),
      -1,
    );

    const board = await this.boardRepository.create({
      ...dto,
      projectId,
      organizationId: user?.organizationId,
      isDefault: false,
      position: maxPosition + 1,
    } as any);

    this.projectActivityService.log(projectId, ProjectActivityAction.CREATE, ProjectEntityType.BOARD, `Created board "${dto.name}"`, (board as any).id);
    return board;
  }

  async update(projectId: string, id: string, dto: UpdateBoardDto) {
    const board = await this.ensureBoardInProject(id, projectId);

    const changes = Object.keys(dto);
    await this.boardRepository.update({ id } as any, dto as any);

    if (changes.length > 0) {
      const summary = changes.join(', ');
      this.projectActivityService.log(board.projectId, ProjectActivityAction.UPDATE, ProjectEntityType.BOARD, `Updated board "${board.name}" (${summary})`, id, { fields: changes });
    }

    return this.boardRepository.findById(id);
  }

  async remove(projectId: string, id: string) {
    const board = await this.ensureBoardInProject(id, projectId);

    this.projectActivityService.log(board.projectId, ProjectActivityAction.DELETE, ProjectEntityType.BOARD, `Deleted board "${board.name}"`, id);
    return this.boardRepository.delete({ id } as any);
  }
}
