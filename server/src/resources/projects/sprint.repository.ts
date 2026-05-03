import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Sprint } from './entities/sprint.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class SprintRepository extends BaseRepository<Sprint> {
  constructor(
    @InjectModel(Sprint)
    sprintModel: typeof Sprint,
    userContextService: UserContextService,
  ) {
    super(sprintModel, undefined, userContextService);
  }
}
