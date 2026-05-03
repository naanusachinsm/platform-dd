import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinRecurringInvoice } from './entities/fin-recurring-invoice.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinRecurringInvoiceRepository extends BaseRepository<FinRecurringInvoice> {
  constructor(
    @InjectModel(FinRecurringInvoice)
    recurringInvoiceModel: typeof FinRecurringInvoice,
    userContextService: UserContextService,
  ) {
    super(recurringInvoiceModel, undefined, userContextService);
  }
}
