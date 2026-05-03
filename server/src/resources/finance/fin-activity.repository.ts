import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinActivity } from './entities/fin-activity.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinActivityRepository extends BaseRepository<FinActivity> {
  constructor(
    @InjectModel(FinActivity)
    model: typeof FinActivity,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
