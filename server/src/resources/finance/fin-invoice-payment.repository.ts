import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinInvoicePayment } from './entities/fin-invoice-payment.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinInvoicePaymentRepository extends BaseRepository<FinInvoicePayment> {
  constructor(
    @InjectModel(FinInvoicePayment)
    invoicePaymentModel: typeof FinInvoicePayment,
    userContextService: UserContextService,
  ) {
    super(invoicePaymentModel, undefined, userContextService);
  }
}
