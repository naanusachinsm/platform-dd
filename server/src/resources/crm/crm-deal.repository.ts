import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { CrmDeal } from './entities/crm-deal.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class CrmDealRepository extends BaseRepository<CrmDeal> {
  constructor(
    @InjectModel(CrmDeal)
    dealModel: typeof CrmDeal,
    userContextService: UserContextService,
  ) {
    super(dealModel, undefined, userContextService);
  }
}
