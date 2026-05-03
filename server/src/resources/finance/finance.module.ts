import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommonModule } from 'src/common/common.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinTaxRate } from './entities/fin-tax-rate.entity';
import { FinProduct } from './entities/fin-product.entity';
import { FinVendor } from './entities/fin-vendor.entity';
import { FinInvoice } from './entities/fin-invoice.entity';
import { FinInvoiceItem } from './entities/fin-invoice-item.entity';
import { FinInvoicePayment } from './entities/fin-invoice-payment.entity';
import { FinEstimate } from './entities/fin-estimate.entity';
import { FinEstimateItem } from './entities/fin-estimate-item.entity';
import { FinRecurringInvoice } from './entities/fin-recurring-invoice.entity';
import { FinExpenseCategory } from './entities/fin-expense-category.entity';
import { FinExpense } from './entities/fin-expense.entity';
import { FinTaxRateRepository } from './fin-tax-rate.repository';
import { FinProductRepository } from './fin-product.repository';
import { FinVendorRepository } from './fin-vendor.repository';
import { FinInvoiceRepository } from './fin-invoice.repository';
import { FinInvoiceItemRepository } from './fin-invoice-item.repository';
import { FinInvoicePaymentRepository } from './fin-invoice-payment.repository';
import { FinEstimateRepository } from './fin-estimate.repository';
import { FinEstimateItemRepository } from './fin-estimate-item.repository';
import { FinEstimateVersion } from './entities/fin-estimate-version.entity';
import { FinEstimateVersionRepository } from './fin-estimate-version.repository';
import { FinRecurringInvoiceRepository } from './fin-recurring-invoice.repository';
import { FinExpenseCategoryRepository } from './fin-expense-category.repository';
import { FinExpenseRepository } from './fin-expense.repository';
import { FinActivity } from './entities/fin-activity.entity';
import { FinActivityRepository } from './fin-activity.repository';
import { FinancePdfService } from './services/finance-pdf.service';
import { FinanceActivityService } from './services/finance-activity.service';
import { RecurringInvoiceScheduler } from './services/recurring-invoice.scheduler';

@Module({
  imports: [
    SequelizeModule.forFeature([
      FinTaxRate,
      FinProduct,
      FinVendor,
      FinInvoice,
      FinInvoiceItem,
      FinInvoicePayment,
      FinEstimate,
      FinEstimateItem,
      FinEstimateVersion,
      FinRecurringInvoice,
      FinExpenseCategory,
      FinExpense,
      FinActivity,
    ]),
    CommonModule,
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinTaxRateRepository,
    FinProductRepository,
    FinVendorRepository,
    FinInvoiceRepository,
    FinInvoiceItemRepository,
    FinInvoicePaymentRepository,
    FinEstimateRepository,
    FinEstimateItemRepository,
    FinEstimateVersionRepository,
    FinRecurringInvoiceRepository,
    FinExpenseCategoryRepository,
    FinExpenseRepository,
    FinActivityRepository,
    FinancePdfService,
    FinanceActivityService,
    RecurringInvoiceScheduler,
  ],
  exports: [FinanceService, FinancePdfService, FinanceActivityService],
})
export class FinanceModule {}
