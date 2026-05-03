import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { FinRecurringInvoice, RecurringFrequency } from '../entities/fin-recurring-invoice.entity';
import { FinInvoice, InvoiceStatus } from '../entities/fin-invoice.entity';
import { FinanceService } from '../finance.service';
import { FinanceActivityService } from './finance-activity.service';
import { FinActivityAction, FinEntityType } from '../entities/fin-activity.entity';

@Injectable()
export class RecurringInvoiceScheduler {
  private readonly logger = new Logger(RecurringInvoiceScheduler.name);

  constructor(
    @InjectModel(FinRecurringInvoice)
    private readonly recurringModel: typeof FinRecurringInvoice,
    @InjectModel(FinInvoice)
    private readonly invoiceModel: typeof FinInvoice,
    private readonly financeService: FinanceService,
    private readonly activityService: FinanceActivityService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringInvoices() {
    this.logger.log('Processing recurring invoices...');
    const today = new Date().toISOString().split('T')[0];

    try {
      const dueRecurring = await this.recurringModel.findAll({
        where: {
          isActive: true,
          nextIssueDate: { [Op.lte]: today },
          [Op.or]: [
            { endDate: null },
            { endDate: { [Op.gte]: today } },
          ],
        },
      });

      this.logger.log(`Found ${dueRecurring.length} recurring invoices to process`);

      for (const rec of dueRecurring) {
        try {
          await this.generateFromRecurring(rec);
        } catch (err: any) {
          this.logger.error(`Failed to generate invoice for recurring ${rec.id}: ${err.message}`);
        }
      }

      this.logger.log('Recurring invoice processing completed');
    } catch (err: any) {
      this.logger.error(`Recurring invoice scheduler failed: ${err.message}`, err.stack);
    }
  }

  private async generateFromRecurring(rec: FinRecurringInvoice): Promise<void> {
    const baseInvoice = await this.financeService.findInvoiceById(rec.basedOnInvoiceId);
    const base = baseInvoice as any;

    const today = new Date().toISOString().split('T')[0];
    const dueDate = this.addDays(today, 30);

    const newInvoice = await this.financeService.createInvoiceFromRecurring({
      organizationId: rec.organizationId,
      crmCompanyId: base.crmCompanyId,
      crmContactId: base.crmContactId,
      crmDealId: base.crmDealId,
      issueDate: today,
      dueDate,
      currency: base.currency,
      notes: base.notes,
      terms: base.terms,
      customerName: base.customerName,
      customerEmail: base.customerEmail,
      items: (base.items || []).map((item: any) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: item.taxRateId,
        discountPercent: item.discountPercent || 0,
      })),
    });

    const nextDate = this.calculateNextDate(rec.nextIssueDate, rec.frequency);
    await rec.update({
      nextIssueDate: nextDate,
      lastGeneratedAt: new Date(),
      totalGenerated: rec.totalGenerated + 1,
    });

    this.activityService.log(
      FinActivityAction.CREATE,
      FinEntityType.INVOICE,
      (newInvoice as any).id,
      `Invoice ${(newInvoice as any).invoiceNumber} auto-generated from recurring template`,
      { recurringInvoiceId: rec.id },
    );

    this.logger.log(`Generated invoice ${(newInvoice as any).invoiceNumber} from recurring ${rec.id}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdueInvoices() {
    this.logger.log('Checking for overdue invoices...');
    const today = new Date().toISOString().split('T')[0];

    try {
      const overdueStatuses = [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PARTIALLY_PAID];
      const [count] = await this.invoiceModel.update(
        { status: InvoiceStatus.OVERDUE } as any,
        {
          where: {
            status: { [Op.in]: overdueStatuses },
            dueDate: { [Op.lt]: today },
          } as any,
        },
      );

      if (count > 0) {
        this.logger.log(`Marked ${count} invoices as OVERDUE`);
      } else {
        this.logger.log('No overdue invoices found');
      }
    } catch (err: any) {
      this.logger.error(`Overdue check failed: ${err.message}`, err.stack);
    }
  }

  private calculateNextDate(currentDate: string, frequency: RecurringFrequency): string {
    const d = new Date(currentDate);
    switch (frequency) {
      case RecurringFrequency.WEEKLY: d.setDate(d.getDate() + 7); break;
      case RecurringFrequency.BIWEEKLY: d.setDate(d.getDate() + 14); break;
      case RecurringFrequency.MONTHLY: d.setMonth(d.getMonth() + 1); break;
      case RecurringFrequency.QUARTERLY: d.setMonth(d.getMonth() + 3); break;
      case RecurringFrequency.SEMI_ANNUALLY: d.setMonth(d.getMonth() + 6); break;
      case RecurringFrequency.YEARLY: d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split('T')[0];
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
