import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinTaxRate } from './entities/fin-tax-rate.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinTaxRateRepository extends BaseRepository<FinTaxRate> {
  constructor(
    @InjectModel(FinTaxRate)
    taxRateModel: typeof FinTaxRate,
    userContextService: UserContextService,
  ) {
    super(taxRateModel, undefined, userContextService);
  }
}
