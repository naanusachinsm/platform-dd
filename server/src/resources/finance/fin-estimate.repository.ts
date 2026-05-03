import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinEstimate } from './entities/fin-estimate.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinEstimateRepository extends BaseRepository<FinEstimate> {
  constructor(
    @InjectModel(FinEstimate)
    estimateModel: typeof FinEstimate,
    userContextService: UserContextService,
  ) {
    super(estimateModel, undefined, userContextService);
  }
}
