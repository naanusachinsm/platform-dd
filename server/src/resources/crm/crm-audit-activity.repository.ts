import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { CrmAuditActivity } from './entities/crm-audit-activity.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class CrmAuditActivityRepository extends BaseRepository<CrmAuditActivity> {
  constructor(
    @InjectModel(CrmAuditActivity)
    model: typeof CrmAuditActivity,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
