import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { CrmActivity } from './entities/crm-activity.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class CrmActivityRepository extends BaseRepository<CrmActivity> {
  constructor(
    @InjectModel(CrmActivity)
    activityModel: typeof CrmActivity,
    userContextService: UserContextService,
  ) {
    super(activityModel, undefined, userContextService);
  }
}
