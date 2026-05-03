import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Board } from './entities/board.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class BoardRepository extends BaseRepository<Board> {
  constructor(
    @InjectModel(Board)
    boardModel: typeof Board,
    userContextService: UserContextService,
  ) {
    super(boardModel, undefined, userContextService);
  }
}
