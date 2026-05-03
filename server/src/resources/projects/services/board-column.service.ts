import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BoardColumnRepository } from '../board-column.repository';
import { BoardColumn } from '../entities/board-column.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { CreateBoardColumnDto, UpdateBoardColumnDto, ReorderColumnsDto } from '../dto/create-board-column.dto';

const DEFAULT_COLUMNS = [
  { name: 'Todo', position: 0, isDefault: true },
  { name: 'In Progress', position: 1, isDefault: true },
  { name: 'Done', position: 2, isDefault: true },
];

@Injectable()
export class BoardColumnService {
  private readonly logger = new Logger(BoardColumnService.name);

  constructor(
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly userContextService: UserContextService,
    private readonly transactionManager: TransactionManager,
  ) {}

  async ensureDefaultColumns(organizationId: string): Promise<BoardColumn[]> {
    const existing = await this.boardColumnRepository.findAll({
      where: { organizationId } as any,
      pagination: { page: 1, limit: 100 },
      bypassTenantFilter: false,
    });

    if (existing.data.length > 0) {
      return existing.data as BoardColumn[];
    }

    return this.transactionManager.execute(async (transaction) => {
      const columns: BoardColumn[] = [];
      for (const col of DEFAULT_COLUMNS) {
        const created = await this.boardColumnRepository.create(
          { ...col, organizationId } as any,
          transaction,
        );
        columns.push(created);
      }
      return columns;
    });
  }

  async findAll(organizationId: string) {
    return this.boardColumnRepository.findAll({
      where: { organizationId } as any,
      pagination: { page: 1, limit: 100, sortBy: 'position', sortOrder: 'ASC' },
    });
  }

  async create(dto: CreateBoardColumnDto) {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;

    const existing = await this.boardColumnRepository.findAll({
      where: { organizationId } as any,
      pagination: { page: 1, limit: 100 },
    });

    const maxPosition = existing.data.reduce(
      (max: number, col: any) => Math.max(max, col.position || 0),
      -1,
    );

    return this.boardColumnRepository.create({
      name: dto.name,
      organizationId,
      position: maxPosition + 1,
      isDefault: false,
    } as any);
  }

  async update(id: string, dto: UpdateBoardColumnDto) {
    const column = await this.boardColumnRepository.findById(id) as any;
    if (!column) throw new BadRequestException('Column not found');

    if (column.isDefault && dto.name) {
      throw new BadRequestException('Cannot rename default columns');
    }

    await this.boardColumnRepository.update({ id } as any, dto as any);
    return this.boardColumnRepository.findById(id);
  }

  async reorder(dto: ReorderColumnsDto) {
    return this.transactionManager.execute(async (transaction) => {
      for (let i = 0; i < dto.columnIds.length; i++) {
        await this.boardColumnRepository.update(
          { id: dto.columnIds[i] } as any,
          { position: i } as any,
          transaction,
        );
      }
      const user = this.userContextService.getCurrentUser();
      return this.findAll(user?.organizationId);
    });
  }

  async remove(id: string) {
    const column = await this.boardColumnRepository.findById(id) as any;
    if (!column) throw new BadRequestException('Column not found');
    if (column.isDefault) {
      throw new BadRequestException('Cannot delete default columns (Todo, In Progress, Done)');
    }

    return this.boardColumnRepository.delete({ id } as any);
  }
}
