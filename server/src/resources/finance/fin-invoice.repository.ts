import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinInvoice } from './entities/fin-invoice.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinInvoiceRepository extends BaseRepository<FinInvoice> {
  constructor(
    @InjectModel(FinInvoice)
    invoiceModel: typeof FinInvoice,
    userContextService: UserContextService,
  ) {
    super(invoiceModel, undefined, userContextService);
  }
}
