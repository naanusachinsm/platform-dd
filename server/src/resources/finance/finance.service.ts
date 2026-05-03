import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { FinTaxRateRepository } from './fin-tax-rate.repository';
import { FinProductRepository } from './fin-product.repository';
import { FinVendorRepository } from './fin-vendor.repository';
import { FinInvoiceRepository } from './fin-invoice.repository';
import { FinInvoiceItemRepository } from './fin-invoice-item.repository';
import { FinInvoicePaymentRepository } from './fin-invoice-payment.repository';
import { FinEstimateRepository } from './fin-estimate.repository';
import { FinEstimateItemRepository } from './fin-estimate-item.repository';
import { FinRecurringInvoiceRepository } from './fin-recurring-invoice.repository';
import { FinExpenseCategoryRepository } from './fin-expense-category.repository';
import { FinExpenseRepository } from './fin-expense.repository';
import { FinEstimateVersionRepository } from './fin-estimate-version.repository';
import { FinanceActivityService } from './services/finance-activity.service';
import { FinActivityAction, FinEntityType } from './entities/fin-activity.entity';
import { FinTaxRate } from './entities/fin-tax-rate.entity';
import { FinProduct } from './entities/fin-product.entity';
import { FinVendor } from './entities/fin-vendor.entity';
import { FinInvoice, InvoiceStatus } from './entities/fin-invoice.entity';
import { FinInvoiceItem } from './entities/fin-invoice-item.entity';
import { FinInvoicePayment } from './entities/fin-invoice-payment.entity';
import { FinEstimate, EstimateStatus } from './entities/fin-estimate.entity';
import { FinEstimateItem } from './entities/fin-estimate-item.entity';
import { FinRecurringInvoice } from './entities/fin-recurring-invoice.entity';
import { FinExpenseCategory } from './entities/fin-expense-category.entity';
import { FinExpense } from './entities/fin-expense.entity';
import { CrmCompany } from 'src/resources/crm/entities/crm-company.entity';
import { CrmContact } from 'src/resources/crm/entities/crm-contact.entity';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateInvoiceDto, CreateInvoiceItemDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateInvoicePaymentDto } from './dto/create-invoice-payment.dto';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  TaxRateQueryDto,
  ProductQueryDto,
  VendorQueryDto,
  InvoiceQueryDto,
  EstimateQueryDto,
  RecurringInvoiceQueryDto,
  ExpenseCategoryQueryDto,
  ExpenseQueryDto,
  InvoicePaymentQueryDto,
  DashboardQueryDto,
} from './dto/finance-query.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly taxRateRepository: FinTaxRateRepository,
    private readonly productRepository: FinProductRepository,
    private readonly vendorRepository: FinVendorRepository,
    private readonly invoiceRepository: FinInvoiceRepository,
    private readonly invoiceItemRepository: FinInvoiceItemRepository,
    private readonly invoicePaymentRepository: FinInvoicePaymentRepository,
    private readonly estimateRepository: FinEstimateRepository,
    private readonly estimateItemRepository: FinEstimateItemRepository,
    private readonly recurringInvoiceRepository: FinRecurringInvoiceRepository,
    private readonly expenseCategoryRepository: FinExpenseCategoryRepository,
    private readonly expenseRepository: FinExpenseRepository,
    private readonly estimateVersionRepository: FinEstimateVersionRepository,
    private readonly financeActivityService: FinanceActivityService,
    private readonly transactionManager: TransactionManager,
    private readonly userContextService: UserContextService,
  ) {}

  private getOrganizationId(): string {
    return this.userContextService.getCurrentUser()?.organizationId;
  }

  private getDateRangeFilter(dateRange?: string, dateField = 'createdAt'): WhereOptions | null {
    if (!dateRange || dateRange === 'all') return null;
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 86400000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 86400000);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_quarter': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), qMonth, 1);
        break;
      }
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return null;
    }

    return { [dateField]: { [Op.gte]: startDate } } as any;
  }

  // ─── Tax Rates ──────────────────────────────────────────

  async createTaxRate(dto: CreateTaxRateDto): Promise<FinTaxRate> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      return this.taxRateRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.TAX_RATE, (result as any).id, `Tax rate "${dto.name}" created`);
    return result;
  }

  async findAllTaxRates(query: TaxRateQueryDto) {
    const where: WhereOptions<FinTaxRate> = {};
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.taxRateRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 50,
        searchTerm: query.searchTerm || '',
        searchFields: ['name'],
        sortBy: 'name',
        sortOrder: query.sortOrder || 'ASC',
      },
    });
  }

  async findTaxRateById(id: string): Promise<FinTaxRate> {
    const record = await this.taxRateRepository.findById(id);
    if (!record) throw new NotFoundException(`Tax rate with ID '${id}' not found`);
    return record as FinTaxRate;
  }

  async updateTaxRate(id: string, dto: UpdateTaxRateDto): Promise<FinTaxRate> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findTaxRateById(id);
      await this.taxRateRepository.update({ id }, dto as any, transaction);
      return this.findTaxRateById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.TAX_RATE, id, `Tax rate "${(result as any).name}" updated`);
    return result;
  }

  async deleteTaxRate(id: string): Promise<FinTaxRate> {
    const record = await this.findTaxRateById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.TAX_RATE, id, `Tax rate "${(record as any).name}" deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.taxRateRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Products ──────────────────────────────────────────

  async createProduct(dto: CreateProductDto): Promise<FinProduct> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      if (dto.taxRateId) await this.findTaxRateById(dto.taxRateId);
      return this.productRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.PRODUCT, (result as any).id, `Product "${dto.name}" created`);
    return result;
  }

  async findAllProducts(query: ProductQueryDto) {
    const where: WhereOptions<FinProduct> = {};
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.productRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['name', 'description', 'sku'],
        sortBy: 'name',
        sortOrder: query.sortOrder || 'ASC',
      },
      include: [
        { model: FinTaxRate, attributes: ['id', 'name', 'rate', 'type'] },
      ],
    });
  }

  async findProductById(id: string): Promise<FinProduct> {
    const record = await this.productRepository.findOne({
      where: { id } as any,
      include: [{ model: FinTaxRate, attributes: ['id', 'name', 'rate', 'type'] }],
    });
    if (!record) throw new NotFoundException(`Product with ID '${id}' not found`);
    return record as FinProduct;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<FinProduct> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findProductById(id);
      if (dto.taxRateId) await this.findTaxRateById(dto.taxRateId);
      await this.productRepository.update({ id }, dto as any, transaction);
      return this.findProductById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.PRODUCT, id, `Product "${(result as any).name}" updated`);
    return result;
  }

  async deleteProduct(id: string): Promise<FinProduct> {
    const record = await this.findProductById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.PRODUCT, id, `Product "${(record as any).name}" deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.productRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Vendors ──────────────────────────────────────────

  async createVendor(dto: CreateVendorDto): Promise<FinVendor> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      return this.vendorRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.VENDOR, (result as any).id, `Vendor "${dto.name}" created`);
    return result;
  }

  async findAllVendors(query: VendorQueryDto) {
    const where: WhereOptions<FinVendor> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.crmCompanyId) where.crmCompanyId = query.crmCompanyId;

    return this.vendorRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['name', 'email', 'city', 'country'],
        sortBy: 'name',
        sortOrder: query.sortOrder || 'ASC',
      },
    });
  }

  async findVendorById(id: string): Promise<FinVendor> {
    const record = await this.vendorRepository.findById(id);
    if (!record) throw new NotFoundException(`Vendor with ID '${id}' not found`);
    return record as FinVendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto): Promise<FinVendor> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findVendorById(id);
      await this.vendorRepository.update({ id }, dto as any, transaction);
      return this.findVendorById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.VENDOR, id, `Vendor "${(result as any).name}" updated`);
    return result;
  }

  async deleteVendor(id: string): Promise<FinVendor> {
    const record = await this.findVendorById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.VENDOR, id, `Vendor "${(record as any).name}" deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.vendorRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Invoices ──────────────────────────────────────────

  private async generateInvoiceNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const latest = await this.invoiceRepository.findAll({
      where: { invoiceNumber: { [Op.like]: `${prefix}%` } } as any,
      pagination: {
        page: 1,
        limit: 1,
        searchTerm: '',
        searchFields: [],
        sortBy: 'invoiceNumber',
        sortOrder: 'DESC',
      },
    });

    let nextNum = 1;
    if (latest.data?.length > 0) {
      const lastNum = (latest.data[0] as any).invoiceNumber;
      const parts = lastNum.split('-');
      nextNum = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  private async calculateLineItemTotals(
    items: CreateInvoiceItemDto[],
    orgId: string,
  ): Promise<{ processedItems: any[]; subtotal: number; taxTotal: number }> {
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems: any[] = [];

    const taxRateMap = new Map<string, number>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let taxRate = 0;

      if (item.taxRateId) {
        if (!taxRateMap.has(item.taxRateId)) {
          const tr = await this.taxRateRepository.findById(item.taxRateId);
          taxRateMap.set(item.taxRateId, tr ? parseFloat((tr as any).rate) : 0);
        }
        taxRate = taxRateMap.get(item.taxRateId) || 0;
      }

      const baseAmount = item.quantity * item.unitPrice;
      const discountAmount = baseAmount * ((item.discountPercent || 0) / 100);
      const afterDiscount = baseAmount - discountAmount;
      const taxAmount = afterDiscount * (taxRate / 100);
      const lineTotal = afterDiscount + taxAmount;

      subtotal += afterDiscount;
      taxTotal += taxAmount;

      processedItems.push({
        ...item,
        organizationId: orgId,
        taxAmount: Math.round(taxAmount * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100,
        sortOrder: item.sortOrder ?? i,
      });
    }

    return {
      processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
    };
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<FinInvoice> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      const invoiceNumber = await this.generateInvoiceNumber(orgId);

      let subtotal = 0;
      let taxTotal = 0;
      let processedItems: any[] = [];

      if (dto.items?.length) {
        const calc = await this.calculateLineItemTotals(dto.items, orgId);
        subtotal = calc.subtotal;
        taxTotal = calc.taxTotal;
        processedItems = calc.processedItems;
      }

      const discountAmount = dto.discountAmount || 0;
      const total = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

      const invoice = await this.invoiceRepository.create(
        {
          ...dto,
          organizationId: orgId,
          invoiceNumber,
          subtotal,
          taxTotal,
          discountAmount,
          total,
          amountPaid: 0,
          amountDue: total,
          items: undefined,
        } as any,
        transaction,
      );

      for (const item of processedItems) {
        await this.invoiceItemRepository.create(
          { ...item, invoiceId: (invoice as any).id },
          transaction,
        );
      }

      return invoice;
    });
    const full = await this.findInvoiceById((result as any).id);
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.INVOICE, (full as any).id, `Invoice ${(full as any).invoiceNumber} created`);
    return full;
  }

  async findAllInvoices(query: InvoiceQueryDto) {
    const where: WhereOptions<FinInvoice> = {};
    if (query.status) where.status = query.status;
    if (query.crmCompanyId) where.crmCompanyId = query.crmCompanyId;
    if (query.crmContactId) where.crmContactId = query.crmContactId;
    if (query.currency) where.currency = query.currency;

    const dateFilter = this.getDateRangeFilter(query.dateRange, 'issueDate');
    if (dateFilter) Object.assign(where, dateFilter);

    return this.invoiceRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['invoiceNumber', 'customerName', 'customerEmail'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
  }

  async findInvoiceById(id: string): Promise<FinInvoice> {
    const record = await this.invoiceRepository.findOne({
      where: { id } as any,
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
    if (!record) throw new NotFoundException(`Invoice with ID '${id}' not found`);

    const items = await this.invoiceItemRepository.findAll({
      where: { invoiceId: id } as any,
      pagination: {
        page: 1,
        limit: 100,
        searchTerm: '',
        searchFields: [],
        sortBy: 'sortOrder',
        sortOrder: 'ASC',
      },
      include: [
        { model: FinProduct, attributes: ['id', 'name'] },
        { model: FinTaxRate, attributes: ['id', 'name', 'rate'] },
      ],
    });

    const payments = await this.invoicePaymentRepository.findAll({
      where: { invoiceId: id } as any,
      pagination: {
        page: 1,
        limit: 100,
        searchTerm: '',
        searchFields: [],
        sortBy: 'paymentDate',
        sortOrder: 'DESC',
      },
    });

    const plain = record && typeof (record as any).toJSON === 'function'
      ? (record as any).toJSON()
      : JSON.parse(JSON.stringify(record));
    plain.items = items.data;
    plain.payments = payments.data;
    return plain;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<FinInvoice> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.invoiceRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Invoice with ID '${id}' not found`);

      if (
        (existing as any).status !== InvoiceStatus.DRAFT &&
        dto.items
      ) {
        throw new BadRequestException('Can only modify line items on DRAFT invoices');
      }

      const orgId = (existing as any).organizationId;
      let updateData: any = { ...dto, items: undefined };

      if (dto.items) {
        await this.invoiceItemRepository.forceDelete(
          { invoiceId: id } as any,
          transaction,
        );

        const calc = await this.calculateLineItemTotals(dto.items, orgId);
        for (const item of calc.processedItems) {
          await this.invoiceItemRepository.create(
            { ...item, invoiceId: id },
            transaction,
          );
        }

        const discountAmount = dto.discountAmount ?? (existing as any).discountAmount ?? 0;
        const total = Math.round((calc.subtotal + calc.taxTotal - discountAmount) * 100) / 100;
        const amountPaid = parseFloat((existing as any).amountPaid) || 0;

        updateData = {
          ...updateData,
          subtotal: calc.subtotal,
          taxTotal: calc.taxTotal,
          discountAmount,
          total,
          amountDue: Math.round((total - amountPaid) * 100) / 100,
        };
      }

      await this.invoiceRepository.update({ id }, updateData, transaction);
      const result = await this.findInvoiceById(id);
      this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.INVOICE, id, `Invoice ${(result as any).invoiceNumber} updated`);
      return result;
    });
  }

  async deleteInvoice(id: string): Promise<FinInvoice> {
    return this.transactionManager.execute(async (transaction) => {
      const record = await this.invoiceRepository.findById(id, transaction);
      if (!record) throw new NotFoundException(`Invoice with ID '${id}' not found`);
      this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.INVOICE, id, `Invoice ${(record as any).invoiceNumber} deleted`);
      await this.invoiceItemRepository.forceDelete({ invoiceId: id } as any, transaction);
      await this.invoicePaymentRepository.forceDelete({ invoiceId: id } as any, transaction);
      await this.invoiceRepository.delete({ id }, transaction);
      return record as FinInvoice;
    });
  }

  async markInvoiceSent(id: string): Promise<FinInvoice> {
    return this.transactionManager.execute(async (transaction) => {
      const invoice = await this.invoiceRepository.findById(id, transaction);
      if (!invoice) throw new NotFoundException(`Invoice with ID '${id}' not found`);
      if ((invoice as any).status !== InvoiceStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT invoices can be marked as sent');
      }
      await this.invoiceRepository.update(
        { id },
        { status: InvoiceStatus.SENT, sentAt: new Date() } as any,
        transaction,
      );
      this.financeActivityService.log(FinActivityAction.STATUS_CHANGE, FinEntityType.INVOICE, id, `Invoice ${(invoice as any).invoiceNumber} marked as sent`);
      return this.findInvoiceById(id);
    });
  }

  async cancelInvoice(id: string): Promise<FinInvoice> {
    return this.transactionManager.execute(async (transaction) => {
      const invoice = await this.invoiceRepository.findById(id, transaction);
      if (!invoice) throw new NotFoundException(`Invoice with ID '${id}' not found`);
      if ((invoice as any).status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Invoice is already cancelled');
      }
      if ((invoice as any).status === InvoiceStatus.PAID) {
        throw new BadRequestException('Cannot cancel a fully paid invoice');
      }
      await this.invoiceRepository.update(
        { id },
        { status: InvoiceStatus.CANCELLED } as any,
        transaction,
      );
      this.financeActivityService.log(FinActivityAction.STATUS_CHANGE, FinEntityType.INVOICE, id, `Invoice ${(invoice as any).invoiceNumber} cancelled`);
      return this.findInvoiceById(id);
    });
  }

  // ─── Invoice Payments ──────────────────────────────────

  async recordPayment(invoiceId: string, dto: CreateInvoicePaymentDto): Promise<FinInvoicePayment> {
    return this.transactionManager.execute(async (transaction) => {
      const invoice = await this.invoiceRepository.findById(invoiceId, transaction);
      if (!invoice) throw new NotFoundException(`Invoice with ID '${invoiceId}' not found`);

      const status = (invoice as any).status;
      if (status === InvoiceStatus.CANCELLED || status === InvoiceStatus.PAID) {
        throw new BadRequestException(`Cannot record payment on a ${status} invoice`);
      }

      const orgId = (invoice as any).organizationId;
      const amountDue = parseFloat((invoice as any).amountDue) || 0;

      if (dto.amount > amountDue) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds amount due (${amountDue})`,
        );
      }

      const payment = await this.invoicePaymentRepository.create(
        { ...dto, invoiceId, organizationId: orgId } as any,
        transaction,
      );

      const newAmountPaid =
        Math.round((parseFloat((invoice as any).amountPaid) + dto.amount) * 100) / 100;
      const newAmountDue =
        Math.round((parseFloat((invoice as any).total) - newAmountPaid) * 100) / 100;

      let newStatus = status;
      if (newAmountDue <= 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      await this.invoiceRepository.update(
        { id: invoiceId },
        {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
        } as any,
        transaction,
      );

      this.financeActivityService.log(FinActivityAction.PAYMENT, FinEntityType.INVOICE, invoiceId, `Payment of ${dto.amount} recorded on invoice`, { paymentId: (payment as any).id, amount: dto.amount });
      return payment;
    });
  }

  async findInvoicePayments(invoiceId: string) {
    await this.findInvoiceById(invoiceId);
    return this.invoicePaymentRepository.findAll({
      where: { invoiceId } as any,
      pagination: {
        page: 1,
        limit: 100,
        searchTerm: '',
        searchFields: [],
        sortBy: 'paymentDate',
        sortOrder: 'DESC',
      },
    });
  }

  async deletePayment(invoiceId: string, paymentId: string): Promise<FinInvoicePayment> {
    return this.transactionManager.execute(async (transaction) => {
      const payment = await this.invoicePaymentRepository.findOne({
        where: { id: paymentId, invoiceId } as any,
      });
      if (!payment) throw new NotFoundException('Payment not found');

      const invoice = await this.invoiceRepository.findById(invoiceId, transaction);
      const paymentAmount = parseFloat((payment as any).amount);
      const newAmountPaid =
        Math.round((parseFloat((invoice as any).amountPaid) - paymentAmount) * 100) / 100;
      const newAmountDue =
        Math.round((parseFloat((invoice as any).total) - newAmountPaid) * 100) / 100;

      let newStatus = (invoice as any).status;
      if (newAmountPaid <= 0) {
        newStatus = InvoiceStatus.SENT;
      } else {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      await this.invoicePaymentRepository.forceDelete({ id: paymentId } as any, transaction);
      await this.invoiceRepository.update(
        { id: invoiceId },
        { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus, paidAt: null } as any,
        transaction,
      );

      this.financeActivityService.log(FinActivityAction.PAYMENT, FinEntityType.INVOICE, invoiceId, `Payment deleted from invoice`, { paymentId, amount: parseFloat((payment as any).amount) });
      return payment as FinInvoicePayment;
    });
  }

  // ─── Estimates ──────────────────────────────────────────

  private async generateEstimateNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;

    const latest = await this.estimateRepository.findAll({
      where: { estimateNumber: { [Op.like]: `${prefix}%` } } as any,
      pagination: {
        page: 1,
        limit: 1,
        searchTerm: '',
        searchFields: [],
        sortBy: 'estimateNumber',
        sortOrder: 'DESC',
      },
    });

    let nextNum = 1;
    if (latest.data?.length > 0) {
      const lastNum = (latest.data[0] as any).estimateNumber;
      const parts = lastNum.split('-');
      nextNum = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  async createEstimate(dto: CreateEstimateDto): Promise<FinEstimate> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      const estimateNumber = await this.generateEstimateNumber(orgId);

      let subtotal = 0;
      let taxTotal = 0;
      let processedItems: any[] = [];

      if (dto.items?.length) {
        const calc = await this.calculateLineItemTotals(dto.items, orgId);
        subtotal = calc.subtotal;
        taxTotal = calc.taxTotal;
        processedItems = calc.processedItems;
      }

      const discountAmount = dto.discountAmount || 0;
      const total = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

      const estimate = await this.estimateRepository.create(
        {
          ...dto,
          organizationId: orgId,
          estimateNumber,
          subtotal,
          taxTotal,
          discountAmount,
          total,
          items: undefined,
        } as any,
        transaction,
      );

      for (const item of processedItems) {
        await this.estimateItemRepository.create(
          { ...item, estimateId: (estimate as any).id },
          transaction,
        );
      }

      return estimate;
    });
    const full = await this.findEstimateById((result as any).id);
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.ESTIMATE, (full as any).id, `Estimate ${(full as any).estimateNumber} created`);
    return full;
  }

  async findAllEstimates(query: EstimateQueryDto) {
    const where: WhereOptions<FinEstimate> = {};
    if (query.status) where.status = query.status;
    if (query.crmCompanyId) where.crmCompanyId = query.crmCompanyId;
    if (query.crmContactId) where.crmContactId = query.crmContactId;
    if (query.currency) where.currency = query.currency;

    const dateFilter = this.getDateRangeFilter(query.dateRange, 'issueDate');
    if (dateFilter) Object.assign(where, dateFilter);

    return this.estimateRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['estimateNumber', 'customerName', 'customerEmail'],
        sortBy: 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
  }

  async findEstimateById(id: string): Promise<FinEstimate> {
    const record = await this.estimateRepository.findOne({
      where: { id } as any,
      include: [
        { model: CrmCompany, attributes: ['id', 'name'] },
        { model: CrmContact, attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
    if (!record) throw new NotFoundException(`Estimate with ID '${id}' not found`);

    const items = await this.estimateItemRepository.findAll({
      where: { estimateId: id } as any,
      pagination: {
        page: 1,
        limit: 100,
        searchTerm: '',
        searchFields: [],
        sortBy: 'sortOrder',
        sortOrder: 'ASC',
      },
      include: [
        { model: FinProduct, attributes: ['id', 'name'] },
        { model: FinTaxRate, attributes: ['id', 'name', 'rate'] },
      ],
    });

    const plain = record && typeof (record as any).toJSON === 'function'
      ? (record as any).toJSON()
      : JSON.parse(JSON.stringify(record));
    plain.items = items.data;
    return plain;
  }

  async updateEstimate(id: string, dto: UpdateEstimateDto): Promise<FinEstimate> {
    return this.transactionManager.execute(async (transaction) => {
      const existing = await this.estimateRepository.findById(id, transaction);
      if (!existing) throw new NotFoundException(`Estimate with ID '${id}' not found`);

      const currentVersion = (existing as any).version || 1;
      const currentSnapshot = await this.findEstimateById(id);
      await this.estimateVersionRepository.create(
        {
          organizationId: (existing as any).organizationId,
          estimateId: id,
          version: currentVersion,
          snapshot: JSON.parse(JSON.stringify(currentSnapshot)),
        } as any,
        transaction,
      );

      const orgId = (existing as any).organizationId;
      let updateData: any = { ...dto, items: undefined, version: currentVersion + 1 };

      if (dto.items) {
        await this.estimateItemRepository.forceDelete(
          { estimateId: id } as any,
          transaction,
        );

        const calc = await this.calculateLineItemTotals(dto.items, orgId);
        for (const item of calc.processedItems) {
          await this.estimateItemRepository.create(
            { ...item, estimateId: id },
            transaction,
          );
        }

        const discountAmount = dto.discountAmount ?? (existing as any).discountAmount ?? 0;
        const total = Math.round((calc.subtotal + calc.taxTotal - discountAmount) * 100) / 100;

        updateData = {
          ...updateData,
          subtotal: calc.subtotal,
          taxTotal: calc.taxTotal,
          discountAmount,
          total,
        };
      }

      await this.estimateRepository.update({ id }, updateData, transaction);
      const result = await this.findEstimateById(id);
      this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.ESTIMATE, id, `Estimate ${(result as any).estimateNumber} updated to v${currentVersion + 1}`);
      return result;
    });
  }

  async getEstimateVersions(estimateId: string) {
    await this.findEstimateById(estimateId);
    return this.estimateVersionRepository.findAll({
      where: { estimateId } as any,
      pagination: {
        page: 1,
        limit: 100,
        searchTerm: '',
        searchFields: [],
        sortBy: 'version',
        sortOrder: 'DESC',
      },
    });
  }

  async getEstimateVersion(estimateId: string, version: number) {
    const record = await this.estimateVersionRepository.findOne({
      where: { estimateId, version } as any,
    });
    if (!record) throw new NotFoundException(`Version ${version} not found for this estimate`);
    return record;
  }

  async markEstimateSent(id: string): Promise<FinEstimate> {
    return this.transactionManager.execute(async (transaction) => {
      const estimate = await this.estimateRepository.findById(id, transaction);
      if (!estimate) throw new NotFoundException(`Estimate with ID '${id}' not found`);
      if ((estimate as any).status !== EstimateStatus.DRAFT) return this.findEstimateById(id);
      await this.estimateRepository.update(
        { id },
        { status: EstimateStatus.SENT, sentAt: new Date() } as any,
        transaction,
      );
      this.financeActivityService.log(FinActivityAction.STATUS_CHANGE, FinEntityType.ESTIMATE, id, `Estimate ${(estimate as any).estimateNumber} marked as sent`);
      return this.findEstimateById(id);
    });
  }

  async deleteEstimate(id: string): Promise<FinEstimate> {
    return this.transactionManager.execute(async (transaction) => {
      const record = await this.estimateRepository.findById(id, transaction);
      if (!record) throw new NotFoundException(`Estimate with ID '${id}' not found`);
      this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.ESTIMATE, id, `Estimate ${(record as any).estimateNumber} deleted`);
      await this.estimateItemRepository.forceDelete({ estimateId: id } as any, transaction);
      await this.estimateRepository.delete({ id }, transaction);
      return record as FinEstimate;
    });
  }

  async convertEstimateToInvoice(estimateId: string): Promise<FinInvoice> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const estimate = await this.findEstimateById(estimateId);
      const est = estimate as any;

      if (est.status === EstimateStatus.CONVERTED) {
        throw new BadRequestException('This estimate has already been converted');
      }
      if (est.status === EstimateStatus.REJECTED) {
        throw new BadRequestException('Cannot convert a rejected estimate');
      }

      const orgId = est.organizationId;
      const invoiceNumber = await this.generateInvoiceNumber(orgId);
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      const invoice = await this.invoiceRepository.create(
        {
          organizationId: orgId,
          invoiceNumber,
          crmCompanyId: est.crmCompanyId,
          crmContactId: est.crmContactId,
          crmDealId: est.crmDealId,
          status: InvoiceStatus.DRAFT,
          issueDate: today,
          dueDate,
          subtotal: est.subtotal,
          taxTotal: est.taxTotal,
          discountAmount: est.discountAmount,
          discountType: est.discountType,
          total: est.total,
          amountPaid: 0,
          amountDue: est.total,
          currency: est.currency,
          notes: est.notes,
          terms: est.terms,
          customerName: est.customerName,
          customerEmail: est.customerEmail,
        } as any,
        transaction,
      );

      if (est.items?.length) {
        for (const item of est.items) {
          await this.invoiceItemRepository.create(
            {
              organizationId: orgId,
              invoiceId: (invoice as any).id,
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRateId: item.taxRateId,
              taxAmount: item.taxAmount,
              discountPercent: item.discountPercent,
              lineTotal: item.lineTotal,
              sortOrder: item.sortOrder,
            } as any,
            transaction,
          );
        }
      }

      await this.estimateRepository.update(
        { id: estimateId },
        {
          status: EstimateStatus.CONVERTED,
          convertedInvoiceId: (invoice as any).id,
        } as any,
        transaction,
      );

      return invoice;
    });
    const fullInvoice = await this.findInvoiceById((result as any).id);
    this.financeActivityService.log(FinActivityAction.CONVERT, FinEntityType.ESTIMATE, estimateId, `Estimate converted to invoice ${(fullInvoice as any).invoiceNumber}`, { invoiceId: (fullInvoice as any).id });
    return fullInvoice;
  }

  // ─── Recurring Invoices ──────────────────────────────────

  async createRecurringInvoice(dto: CreateRecurringInvoiceDto): Promise<FinRecurringInvoice> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      await this.findInvoiceById(dto.basedOnInvoiceId);
      return this.recurringInvoiceRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.RECURRING_INVOICE, (result as any).id, `Recurring invoice created`);
    return result;
  }

  async findAllRecurringInvoices(query: RecurringInvoiceQueryDto) {
    const where: WhereOptions<FinRecurringInvoice> = {};
    if (query.frequency) where.frequency = query.frequency;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.recurringInvoiceRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: [],
        sortBy: 'nextIssueDate',
        sortOrder: query.sortOrder || 'ASC',
      },
      include: [
        { model: FinInvoice, attributes: ['id', 'invoiceNumber', 'customerName', 'total', 'currency'] },
      ],
    });
  }

  async findRecurringInvoiceById(id: string): Promise<FinRecurringInvoice> {
    const record = await this.recurringInvoiceRepository.findOne({
      where: { id } as any,
      include: [
        { model: FinInvoice, attributes: ['id', 'invoiceNumber', 'customerName', 'total', 'currency'] },
      ],
    });
    if (!record) throw new NotFoundException(`Recurring invoice with ID '${id}' not found`);
    return record as FinRecurringInvoice;
  }

  async updateRecurringInvoice(id: string, dto: UpdateRecurringInvoiceDto): Promise<FinRecurringInvoice> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findRecurringInvoiceById(id);
      if (dto.basedOnInvoiceId) await this.findInvoiceById(dto.basedOnInvoiceId);
      await this.recurringInvoiceRepository.update({ id }, dto as any, transaction);
      return this.findRecurringInvoiceById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.RECURRING_INVOICE, id, `Recurring invoice updated`);
    return result;
  }

  async deleteRecurringInvoice(id: string): Promise<FinRecurringInvoice> {
    const record = await this.findRecurringInvoiceById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.RECURRING_INVOICE, id, `Recurring invoice deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.recurringInvoiceRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Expense Categories ──────────────────────────────────

  async createExpenseCategory(dto: CreateExpenseCategoryDto): Promise<FinExpenseCategory> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      return this.expenseCategoryRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.EXPENSE_CATEGORY, (result as any).id, `Expense category "${dto.name}" created`);
    return result;
  }

  async findAllExpenseCategories(query: ExpenseCategoryQueryDto) {
    const where: WhereOptions<FinExpenseCategory> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.expenseCategoryRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 50,
        searchTerm: query.searchTerm || '',
        searchFields: ['name'],
        sortBy: 'name',
        sortOrder: query.sortOrder || 'ASC',
      },
    });
  }

  async findExpenseCategoryById(id: string): Promise<FinExpenseCategory> {
    const record = await this.expenseCategoryRepository.findById(id);
    if (!record) throw new NotFoundException(`Expense category with ID '${id}' not found`);
    return record as FinExpenseCategory;
  }

  async updateExpenseCategory(id: string, dto: UpdateExpenseCategoryDto): Promise<FinExpenseCategory> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findExpenseCategoryById(id);
      await this.expenseCategoryRepository.update({ id }, dto as any, transaction);
      return this.findExpenseCategoryById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.EXPENSE_CATEGORY, id, `Expense category "${(result as any).name}" updated`);
    return result;
  }

  async deleteExpenseCategory(id: string): Promise<FinExpenseCategory> {
    const record = await this.findExpenseCategoryById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.EXPENSE_CATEGORY, id, `Expense category "${(record as any).name}" deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.expenseCategoryRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Expenses ──────────────────────────────────────────

  async createExpense(dto: CreateExpenseDto): Promise<FinExpense> {
    const result = await this.transactionManager.execute(async (transaction) => {
      const orgId = this.getOrganizationId();
      if (dto.categoryId) await this.findExpenseCategoryById(dto.categoryId);
      if (dto.vendorId) await this.findVendorById(dto.vendorId);
      return this.expenseRepository.create(
        { ...dto, organizationId: orgId } as any,
        transaction,
      );
    });
    this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.EXPENSE, (result as any).id, `Expense of ${dto.amount} created`);
    return result;
  }

  async findAllExpenses(query: ExpenseQueryDto) {
    const where: WhereOptions<FinExpense> = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.isReimbursable !== undefined) where.isReimbursable = query.isReimbursable;
    if (query.reimbursementStatus) where.reimbursementStatus = query.reimbursementStatus;
    if (query.currency) where.currency = query.currency;

    const dateFilter = this.getDateRangeFilter(query.dateRange, 'expenseDate');
    if (dateFilter) Object.assign(where, dateFilter);

    return this.expenseRepository.findAll({
      where,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        searchTerm: query.searchTerm || '',
        searchFields: ['description', 'referenceNumber'],
        sortBy: 'expenseDate',
        sortOrder: query.sortOrder || 'DESC',
      },
      include: [
        { model: FinExpenseCategory, attributes: ['id', 'name'] },
        { model: FinVendor, attributes: ['id', 'name'] },
      ],
    });
  }

  async findExpenseById(id: string): Promise<FinExpense> {
    const record = await this.expenseRepository.findOne({
      where: { id } as any,
      include: [
        { model: FinExpenseCategory, attributes: ['id', 'name'] },
        { model: FinVendor, attributes: ['id', 'name'] },
      ],
    });
    if (!record) throw new NotFoundException(`Expense with ID '${id}' not found`);
    return record as FinExpense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto): Promise<FinExpense> {
    const result = await this.transactionManager.execute(async (transaction) => {
      await this.findExpenseById(id);
      if (dto.categoryId) await this.findExpenseCategoryById(dto.categoryId);
      if (dto.vendorId) await this.findVendorById(dto.vendorId);
      await this.expenseRepository.update({ id }, dto as any, transaction);
      return this.findExpenseById(id);
    });
    this.financeActivityService.log(FinActivityAction.UPDATE, FinEntityType.EXPENSE, id, `Expense updated`);
    return result;
  }

  async deleteExpense(id: string): Promise<FinExpense> {
    const record = await this.findExpenseById(id);
    this.financeActivityService.log(FinActivityAction.DELETE, FinEntityType.EXPENSE, id, `Expense deleted`);
    return this.transactionManager.execute(async (transaction) => {
      await this.expenseRepository.delete({ id }, transaction);
      return record;
    });
  }

  // ─── Dashboard & Reports ──────────────────────────────────

  async getDashboardStats(query?: DashboardQueryDto) {
    const period = query?.period || 'this_month';
    const dateFilter = this.getDateRangeFilter(period, 'issueDate');

    const invoiceWhere: any = {};
    if (dateFilter) Object.assign(invoiceWhere, dateFilter);
    if (query?.currency) invoiceWhere.currency = query.currency;

    const allInvoices = await this.invoiceRepository.findAll({
      where: invoiceWhere,
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
    });

    const invoices = allInvoices.data as any[];
    const totalRevenue = invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

    const outstanding = invoices
      .filter((i) => [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PARTIALLY_PAID].includes(i.status))
      .reduce((sum, i) => sum + (parseFloat(i.amountDue) || 0), 0);

    const overdue = invoices
      .filter((i) => i.status === InvoiceStatus.OVERDUE)
      .reduce((sum, i) => sum + (parseFloat(i.amountDue) || 0), 0);

    const overdueCount = invoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length;

    const expenseDateFilter = this.getDateRangeFilter(period, 'expenseDate');
    const expenseWhere: any = {};
    if (expenseDateFilter) Object.assign(expenseWhere, expenseDateFilter);
    if (query?.currency) expenseWhere.currency = query.currency;

    const allExpenses = await this.expenseRepository.findAll({
      where: expenseWhere,
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'expenseDate', sortOrder: 'DESC' },
    });

    const expenses = allExpenses.data as any[];
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (parseFloat(e.amount) || 0),
      0,
    );

    const recentInvoices = await this.invoiceRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 5, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
      include: [{ model: CrmCompany, attributes: ['id', 'name'] }],
    });

    const recentExpenses = await this.expenseRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 5, searchTerm: '', searchFields: [], sortBy: 'expenseDate', sortOrder: 'DESC' },
      include: [
        { model: FinExpenseCategory, attributes: ['id', 'name'] },
        { model: FinVendor, attributes: ['id', 'name'] },
      ],
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      overdueCount,
      totalInvoices: allInvoices.total,
      totalExpenseCount: allExpenses.total,
      recentInvoices: recentInvoices.data,
      recentExpenses: recentExpenses.data,
    };
  }

  async createInvoiceFromRecurring(data: any): Promise<FinInvoice> {
    const orgId = data.organizationId;
    const invoiceNumber = await this.generateInvoiceNumber(orgId);

    let subtotal = 0;
    let taxTotal = 0;
    let processedItems: any[] = [];

    if (data.items?.length) {
      const calc = await this.calculateLineItemTotals(data.items, orgId);
      subtotal = calc.subtotal;
      taxTotal = calc.taxTotal;
      processedItems = calc.processedItems;
    }

    const total = Math.round((subtotal + taxTotal) * 100) / 100;

    const result = await this.transactionManager.execute(async (transaction) => {
      const invoice = await this.invoiceRepository.create(
        {
          organizationId: orgId,
          invoiceNumber,
          crmCompanyId: data.crmCompanyId,
          crmContactId: data.crmContactId,
          crmDealId: data.crmDealId,
          status: 'DRAFT',
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          subtotal,
          taxTotal,
          discountAmount: 0,
          total,
          amountPaid: 0,
          amountDue: total,
          currency: data.currency || 'INR',
          notes: data.notes,
          terms: data.terms,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
        } as any,
        transaction,
      );

      for (const item of processedItems) {
        await this.invoiceItemRepository.create(
          { ...item, invoiceId: (invoice as any).id },
          transaction,
        );
      }

      return invoice;
    });

    return this.findInvoiceById((result as any).id);
  }

  async getFinanceActivities(query: { page?: number; limit?: number; entityType?: string }) {
    return this.financeActivityService.findAll(query);
  }

  async getAgingReport() {
    const now = new Date();
    const openStatuses = [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE];

    const allOpen = await this.invoiceRepository.findAll({
      where: { status: { [Op.in]: openStatuses } } as any,
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'dueDate', sortOrder: 'ASC' },
      include: [{ model: CrmCompany, attributes: ['id', 'name'] }],
    });

    const buckets = {
      current: { count: 0, amount: 0, invoices: [] as any[] },
      '1_30': { count: 0, amount: 0, invoices: [] as any[] },
      '31_60': { count: 0, amount: 0, invoices: [] as any[] },
      '61_90': { count: 0, amount: 0, invoices: [] as any[] },
      '90_plus': { count: 0, amount: 0, invoices: [] as any[] },
    };

    for (const inv of allOpen.data as any[]) {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / 86400000);
      const amountDue = parseFloat(inv.amountDue) || 0;

      let bucket: keyof typeof buckets;
      if (daysOverdue <= 0) bucket = 'current';
      else if (daysOverdue <= 30) bucket = '1_30';
      else if (daysOverdue <= 60) bucket = '31_60';
      else if (daysOverdue <= 90) bucket = '61_90';
      else bucket = '90_plus';

      buckets[bucket].count++;
      buckets[bucket].amount += amountDue;
      buckets[bucket].invoices.push(inv);
    }

    Object.values(buckets).forEach((b) => {
      b.amount = Math.round(b.amount * 100) / 100;
    });

    return buckets;
  }

  // ─── CSV Import ──────────────────────────────────────────

  async importVendors(rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> {
    const orgId = this.getOrganizationId();
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      try {
        const name = row.name?.trim();
        if (!name) {
          errors.push(`Row ${rowNum}: name is required`);
          continue;
        }

        const existing = await this.vendorRepository.findOne({
          where: { name, organizationId: orgId } as any,
        });
        if (existing) {
          errors.push(`Row ${rowNum}: Vendor '${name}' already exists`);
          continue;
        }

        await this.vendorRepository.create({
          organizationId: orgId,
          name,
          email: row.email?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          address: row.address?.trim() || undefined,
          city: row.city?.trim() || undefined,
          state: row.state?.trim() || undefined,
          country: row.country?.trim() || undefined,
          postalCode: row.postalCode?.trim() || undefined,
          website: row.website?.trim() || undefined,
          notes: row.notes?.trim() || undefined,
        } as any);
        imported++;
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${this.extractImportError(err)}`);
      }
    }

    if (imported > 0) {
      this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.VENDOR, undefined as any, `${imported} vendors imported via CSV`, { imported, errorCount: errors.length });
    }
    return { imported, errors };
  }

  async importProducts(rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> {
    const orgId = this.getOrganizationId();
    let imported = 0;
    const errors: string[] = [];
    const validTypes = ['PRODUCT', 'SERVICE'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      try {
        const name = row.name?.trim();
        const unitPriceStr = row.unitPrice?.trim();
        const type = row.type?.trim()?.toUpperCase();

        if (!name) {
          errors.push(`Row ${rowNum}: name is required`);
          continue;
        }

        if (!unitPriceStr || isNaN(parseFloat(unitPriceStr))) {
          errors.push(`Row ${rowNum}: unitPrice is required and must be a number`);
          continue;
        }

        if (type && !validTypes.includes(type)) {
          errors.push(`Row ${rowNum}: Invalid type '${row.type}'. Must be one of: ${validTypes.join(', ')}`);
          continue;
        }

        await this.productRepository.create({
          organizationId: orgId,
          name,
          description: row.description?.trim() || undefined,
          type: type || 'SERVICE',
          unitPrice: parseFloat(unitPriceStr),
          unit: row.unit?.trim() || undefined,
          sku: row.sku?.trim() || undefined,
        } as any);
        imported++;
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${this.extractImportError(err)}`);
      }
    }

    if (imported > 0) {
      this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.PRODUCT, undefined as any, `${imported} products imported via CSV`, { imported, errorCount: errors.length });
    }
    return { imported, errors };
  }

  async importExpenses(rows: Record<string, string>[]): Promise<{ imported: number; errors: string[] }> {
    const orgId = this.getOrganizationId();
    let imported = 0;
    const errors: string[] = [];
    const validPaymentMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'];

    const allCategories = await this.expenseCategoryRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 500, searchTerm: '', searchFields: [], sortBy: 'name', sortOrder: 'ASC' },
    });
    const categoryMap = new Map(
      (allCategories.data as any[]).map((c) => [c.name.toLowerCase(), c.id]),
    );

    const allVendors = await this.vendorRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 500, searchTerm: '', searchFields: [], sortBy: 'name', sortOrder: 'ASC' },
    });
    const vendorMap = new Map(
      (allVendors.data as any[]).map((v) => [v.name.toLowerCase(), v.id]),
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      try {
        const amountStr = row.amount?.trim();
        const expenseDate = row.expenseDate?.trim();
        const paymentMethod = row.paymentMethod?.trim()?.toUpperCase();

        if (!amountStr || isNaN(parseFloat(amountStr))) {
          errors.push(`Row ${rowNum}: amount is required and must be a number`);
          continue;
        }

        if (!expenseDate) {
          errors.push(`Row ${rowNum}: expenseDate is required (YYYY-MM-DD)`);
          continue;
        }

        if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
          errors.push(`Row ${rowNum}: Invalid paymentMethod '${row.paymentMethod}'. Must be one of: ${validPaymentMethods.join(', ')}`);
          continue;
        }

        let categoryId: string | undefined;
        const categoryName = row.category?.trim();
        if (categoryName) {
          categoryId = categoryMap.get(categoryName.toLowerCase());
          if (!categoryId) {
            errors.push(`Row ${rowNum}: Category '${categoryName}' not found. Skipping category.`);
          }
        }

        let vendorId: string | undefined;
        const vendorName = row.vendor?.trim();
        if (vendorName) {
          vendorId = vendorMap.get(vendorName.toLowerCase());
          if (!vendorId) {
            errors.push(`Row ${rowNum}: Vendor '${vendorName}' not found. Skipping vendor.`);
          }
        }

        const isReimbursable = row.isReimbursable?.trim()?.toLowerCase();

        await this.expenseRepository.create({
          organizationId: orgId,
          amount: parseFloat(amountStr),
          expenseDate,
          description: row.description?.trim() || undefined,
          categoryId,
          vendorId,
          paymentMethod: paymentMethod || undefined,
          referenceNumber: row.referenceNumber?.trim() || undefined,
          currency: row.currency?.trim()?.toUpperCase() || 'INR',
          notes: row.notes?.trim() || undefined,
          isReimbursable: isReimbursable === 'true' || isReimbursable === 'yes' || isReimbursable === '1',
        } as any);
        imported++;
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${this.extractImportError(err)}`);
      }
    }

    if (imported > 0) {
      this.financeActivityService.log(FinActivityAction.CREATE, FinEntityType.EXPENSE, undefined as any, `${imported} expenses imported via CSV`, { imported, errorCount: errors.length });
    }
    return { imported, errors };
  }

  // ─── CSV Export ──────────────────────────────────────────

  async exportProductsCsv(): Promise<string> {
    const result = await this.productRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'name', sortOrder: 'ASC' },
      include: [{ model: FinTaxRate, attributes: ['id', 'name', 'rate'] }],
    });

    const headers = ['Name', 'Description', 'Type', 'Unit Price', 'Unit', 'SKU', 'Tax Rate', 'Active'];
    const rows = (result.data as any[]).map((p) => [
      p.name,
      p.description || '',
      p.type,
      p.unitPrice,
      p.unit || '',
      p.sku || '',
      p.taxRate ? `${p.taxRate.name} (${p.taxRate.rate}%)` : '',
      p.isActive ? 'Yes' : 'No',
    ]);

    return this.buildCsv(headers, rows);
  }

  async exportVendorsCsv(): Promise<string> {
    const result = await this.vendorRepository.findAll({
      where: {},
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'name', sortOrder: 'ASC' },
    });

    const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Country', 'Postal Code', 'Website', 'Active'];
    const rows = (result.data as any[]).map((v) => [
      v.name,
      v.email || '',
      v.phone || '',
      v.address || '',
      v.city || '',
      v.state || '',
      v.country || '',
      v.postalCode || '',
      v.website || '',
      v.isActive ? 'Yes' : 'No',
    ]);

    return this.buildCsv(headers, rows);
  }

  async exportInvoicesCsv(query?: any): Promise<string> {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.currency) where.currency = query.currency;

    const result = await this.invoiceRepository.findAll({
      where,
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'createdAt', sortOrder: 'DESC' },
    });

    const headers = ['Invoice #', 'Customer', 'Status', 'Issue Date', 'Due Date', 'Subtotal', 'Tax', 'Discount', 'Total', 'Paid', 'Due', 'Currency'];
    const rows = (result.data as any[]).map((inv) => [
      inv.invoiceNumber,
      inv.customerName || '',
      inv.status,
      inv.issueDate,
      inv.dueDate,
      inv.subtotal,
      inv.taxTotal,
      inv.discountAmount,
      inv.total,
      inv.amountPaid,
      inv.amountDue,
      inv.currency,
    ]);

    return this.buildCsv(headers, rows);
  }

  async exportExpensesCsv(query?: any): Promise<string> {
    const where: any = {};
    if (query?.categoryId) where.categoryId = query.categoryId;
    if (query?.vendorId) where.vendorId = query.vendorId;
    if (query?.currency) where.currency = query.currency;

    const result = await this.expenseRepository.findAll({
      where,
      pagination: { page: 1, limit: 10000, searchTerm: '', searchFields: [], sortBy: 'expenseDate', sortOrder: 'DESC' },
      include: [
        { model: FinExpenseCategory, attributes: ['id', 'name'] },
        { model: FinVendor, attributes: ['id', 'name'] },
      ],
    });

    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Currency', 'Payment Method', 'Reference #', 'Reimbursable'];
    const rows = (result.data as any[]).map((exp) => [
      exp.expenseDate,
      exp.description || '',
      exp.category?.name || '',
      exp.vendor?.name || '',
      exp.amount,
      exp.currency,
      exp.paymentMethod || '',
      exp.referenceNumber || '',
      exp.isReimbursable ? 'Yes' : 'No',
    ]);

    return this.buildCsv(headers, rows);
  }

  private buildCsv(headers: string[], rows: any[][]): string {
    const escape = (val: any) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const lines = [headers.map(escape).join(',')];
    for (const row of rows) {
      lines.push(row.map(escape).join(','));
    }
    return lines.join('\n');
  }

  private extractImportError(err: any): string {
    if (err.errors?.length) {
      return err.errors.map((e: any) => `${e.path}: ${e.message}`).join('; ');
    }
    if (err.original?.sqlMessage) {
      if (err.original.sqlMessage.includes('Duplicate entry')) {
        return 'Duplicate record already exists';
      }
      return err.original.sqlMessage;
    }
    if (err.message === 'Validation error') {
      return 'Duplicate record already exists';
    }
    return err.message || 'Unknown error';
  }
}
