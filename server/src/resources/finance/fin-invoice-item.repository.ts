import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinInvoiceItem } from './entities/fin-invoice-item.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinInvoiceItemRepository extends BaseRepository<FinInvoiceItem> {
  constructor(
    @InjectModel(FinInvoiceItem)
    invoiceItemModel: typeof FinInvoiceItem,
    userContextService: UserContextService,
  ) {
    super(invoiceItemModel, undefined, userContextService);
  }
}
