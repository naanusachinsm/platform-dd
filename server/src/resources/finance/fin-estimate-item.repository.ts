import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinEstimateItem } from './entities/fin-estimate-item.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinEstimateItemRepository extends BaseRepository<FinEstimateItem> {
  constructor(
    @InjectModel(FinEstimateItem)
    estimateItemModel: typeof FinEstimateItem,
    userContextService: UserContextService,
  ) {
    super(estimateItemModel, undefined, userContextService);
  }
}
