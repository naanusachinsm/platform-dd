import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { BoardColumn } from './entities/board-column.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class BoardColumnRepository extends BaseRepository<BoardColumn> {
  constructor(
    @InjectModel(BoardColumn)
    boardColumnModel: typeof BoardColumn,
    userContextService: UserContextService,
  ) {
    super(boardColumnModel, undefined, userContextService);
  }
}
