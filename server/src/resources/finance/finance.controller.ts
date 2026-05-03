import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FinanceService } from './finance.service';
import { FinancePdfService } from './services/finance-pdf.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { EmailQueue } from 'src/configuration/bull/queues/email.queue';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
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
  DashboardQueryDto,
} from './dto/finance-query.dto';

@Controller()
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly financePdfService: FinancePdfService,
    private readonly userContextService: UserContextService,
    private readonly emailQueue: EmailQueue,
  ) {}

  // ─── Tax Rates ──────────────────────────────────────────

  @Post('tax-rates')
  createTaxRate(@Body() dto: CreateTaxRateDto) {
    return this.financeService.createTaxRate(dto);
  }

  @Get('tax-rates')
  findAllTaxRates(@Query() query: TaxRateQueryDto) {
    return this.financeService.findAllTaxRates(query);
  }

  @Get('tax-rates/:id')
  findTaxRateById(@Param('id') id: string) {
    return this.financeService.findTaxRateById(id);
  }

  @Patch('tax-rates/:id')
  updateTaxRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    return this.financeService.updateTaxRate(id, dto);
  }

  @Delete('tax-rates/:id')
  deleteTaxRate(@Param('id') id: string) {
    return this.financeService.deleteTaxRate(id);
  }

  // ─── Products ──────────────────────────────────────────

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.financeService.createProduct(dto);
  }

  @Get('products')
  findAllProducts(@Query() query: ProductQueryDto) {
    return this.financeService.findAllProducts(query);
  }

  @Get('products/:id')
  findProductById(@Param('id') id: string) {
    return this.financeService.findProductById(id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.financeService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.financeService.deleteProduct(id);
  }

  // ─── Vendors ──────────────────────────────────────────

  @Post('vendors')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.financeService.createVendor(dto);
  }

  @Get('vendors')
  findAllVendors(@Query() query: VendorQueryDto) {
    return this.financeService.findAllVendors(query);
  }

  @Get('vendors/:id')
  findVendorById(@Param('id') id: string) {
    return this.financeService.findVendorById(id);
  }

  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.financeService.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  deleteVendor(@Param('id') id: string) {
    return this.financeService.deleteVendor(id);
  }

  // ─── Dashboard & Reports ──────────────────────────────────

  @Get('dashboard')
  getDashboardStats(@Query() query: DashboardQueryDto) {
    return this.financeService.getDashboardStats(query);
  }

  @Get('reports/aging')
  getAgingReport() {
    return this.financeService.getAgingReport();
  }

  // ─── Invoices ──────────────────────────────────────────

  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(dto);
  }

  @Get('invoices')
  findAllInvoices(@Query() query: InvoiceQueryDto) {
    return this.financeService.findAllInvoices(query);
  }

  @Get('invoices/:id')
  findInvoiceById(@Param('id') id: string) {
    return this.financeService.findInvoiceById(id);
  }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.financeService.updateInvoice(id, dto);
  }

  @Delete('invoices/:id')
  deleteInvoice(@Param('id') id: string) {
    return this.financeService.deleteInvoice(id);
  }

  @Post('invoices/:id/mark-sent')
  markInvoiceSent(@Param('id') id: string) {
    return this.financeService.markInvoiceSent(id);
  }

  @Post('invoices/:id/cancel')
  cancelInvoice(@Param('id') id: string) {
    return this.financeService.cancelInvoice(id);
  }

  // ─── Invoice Payments ──────────────────────────────────

  @Post('invoices/:id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: CreateInvoicePaymentDto) {
    return this.financeService.recordPayment(id, dto);
  }

  @Get('invoices/:id/payments')
  findInvoicePayments(@Param('id') id: string) {
    return this.financeService.findInvoicePayments(id);
  }

  @Delete('invoices/:invoiceId/payments/:paymentId')
  deletePayment(
    @Param('invoiceId') invoiceId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.financeService.deletePayment(invoiceId, paymentId);
  }

  @Get('invoices/:id/pdf')
  async downloadInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.financeService.findInvoiceById(id);
    const user = this.userContextService.getCurrentUser();
    const buffer = await this.financePdfService.generateInvoicePdf(invoice, {
      orgName: user?.organization?.name,
      generatedBy: user?.email,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(invoice as any).invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post('invoices/:id/email')
  async emailInvoice(@Param('id') id: string, @Body() body: { to: string; subject?: string; message?: string }) {
    const invoice = await this.financeService.findInvoiceById(id);
    const user = this.userContextService.getCurrentUser();
    const buffer = await this.financePdfService.generateInvoicePdf(invoice, { orgName: user?.organization?.name, generatedBy: user?.email });
    const invoiceNum = (invoice as any).invoiceNumber;
    const subject = body.subject || `Invoice ${invoiceNum}`;
    const html = `<p>${body.message || `Please find attached invoice ${invoiceNum}.`}</p><p>Regards,<br>${user?.organization?.name || 'Team'}</p>`;
    await this.emailQueue.sendFinanceDocument(body.to, subject, html, buffer.toString('base64'), `${invoiceNum}.pdf`);
    if ((invoice as any).status === 'DRAFT') {
      await this.financeService.markInvoiceSent(id);
    }
    return { message: `Invoice emailed to ${body.to}` };
  }

  // ─── Estimates ──────────────────────────────────────────

  @Post('estimates')
  createEstimate(@Body() dto: CreateEstimateDto) {
    return this.financeService.createEstimate(dto);
  }

  @Get('estimates')
  findAllEstimates(@Query() query: EstimateQueryDto) {
    return this.financeService.findAllEstimates(query);
  }

  @Get('estimates/:id')
  findEstimateById(@Param('id') id: string) {
    return this.financeService.findEstimateById(id);
  }

  @Patch('estimates/:id')
  updateEstimate(@Param('id') id: string, @Body() dto: UpdateEstimateDto) {
    return this.financeService.updateEstimate(id, dto);
  }

  @Delete('estimates/:id')
  deleteEstimate(@Param('id') id: string) {
    return this.financeService.deleteEstimate(id);
  }

  @Post('estimates/:id/convert')
  convertEstimateToInvoice(@Param('id') id: string) {
    return this.financeService.convertEstimateToInvoice(id);
  }

  @Get('estimates/:id/versions')
  getEstimateVersions(@Param('id') id: string) {
    return this.financeService.getEstimateVersions(id);
  }

  @Get('estimates/:id/versions/:version')
  getEstimateVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.financeService.getEstimateVersion(id, parseInt(version, 10));
  }

  @Get('estimates/:id/pdf')
  async downloadEstimatePdf(@Param('id') id: string, @Res() res: Response) {
    const estimate = await this.financeService.findEstimateById(id);
    const user = this.userContextService.getCurrentUser();
    const buffer = await this.financePdfService.generateEstimatePdf(estimate, {
      orgName: user?.organization?.name,
      generatedBy: user?.email,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(estimate as any).estimateNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post('estimates/:id/email')
  async emailEstimate(@Param('id') id: string, @Body() body: { to: string; subject?: string; message?: string }) {
    const estimate = await this.financeService.findEstimateById(id);
    const user = this.userContextService.getCurrentUser();
    const buffer = await this.financePdfService.generateEstimatePdf(estimate, { orgName: user?.organization?.name, generatedBy: user?.email });
    const estNum = (estimate as any).estimateNumber;
    const subject = body.subject || `Estimate ${estNum}`;
    const html = `<p>${body.message || `Please find attached estimate ${estNum}.`}</p><p>Regards,<br>${user?.organization?.name || 'Team'}</p>`;
    await this.emailQueue.sendFinanceDocument(body.to, subject, html, buffer.toString('base64'), `${estNum}.pdf`);
    if ((estimate as any).status === 'DRAFT') {
      await this.financeService.markEstimateSent(id);
    }
    return { message: `Estimate emailed to ${body.to}` };
  }

  // ─── Recurring Invoices ──────────────────────────────────

  @Post('recurring-invoices')
  createRecurringInvoice(@Body() dto: CreateRecurringInvoiceDto) {
    return this.financeService.createRecurringInvoice(dto);
  }

  @Get('recurring-invoices')
  findAllRecurringInvoices(@Query() query: RecurringInvoiceQueryDto) {
    return this.financeService.findAllRecurringInvoices(query);
  }

  @Get('recurring-invoices/:id')
  findRecurringInvoiceById(@Param('id') id: string) {
    return this.financeService.findRecurringInvoiceById(id);
  }

  @Patch('recurring-invoices/:id')
  updateRecurringInvoice(@Param('id') id: string, @Body() dto: UpdateRecurringInvoiceDto) {
    return this.financeService.updateRecurringInvoice(id, dto);
  }

  @Delete('recurring-invoices/:id')
  deleteRecurringInvoice(@Param('id') id: string) {
    return this.financeService.deleteRecurringInvoice(id);
  }

  // ─── Expense Categories ──────────────────────────────────

  @Post('expense-categories')
  createExpenseCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.financeService.createExpenseCategory(dto);
  }

  @Get('expense-categories')
  findAllExpenseCategories(@Query() query: ExpenseCategoryQueryDto) {
    return this.financeService.findAllExpenseCategories(query);
  }

  @Get('expense-categories/:id')
  findExpenseCategoryById(@Param('id') id: string) {
    return this.financeService.findExpenseCategoryById(id);
  }

  @Patch('expense-categories/:id')
  updateExpenseCategory(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.financeService.updateExpenseCategory(id, dto);
  }

  @Delete('expense-categories/:id')
  deleteExpenseCategory(@Param('id') id: string) {
    return this.financeService.deleteExpenseCategory(id);
  }

  // ─── Expenses ──────────────────────────────────────────

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.financeService.createExpense(dto);
  }

  @Get('expenses')
  findAllExpenses(@Query() query: ExpenseQueryDto) {
    return this.financeService.findAllExpenses(query);
  }

  @Get('expenses/:id')
  findExpenseById(@Param('id') id: string) {
    return this.financeService.findExpenseById(id);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.financeService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.financeService.deleteExpense(id);
  }

  // ─── Activities ──────────────────────────────────────────

  @Get('activities')
  getActivities(@Query() query: { page?: string; limit?: string; entityType?: string }) {
    return this.financeService.getFinanceActivities({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      entityType: query.entityType,
    });
  }

  // ─── CSV Export ──────────────────────────────────────────

  @Get('export/invoices')
  async exportInvoices(@Query() query: any, @Res() res: Response) {
    const csv = await this.financeService.exportInvoicesCsv(query);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="invoices-export.csv"',
    });
    res.send(csv);
  }

  @Get('export/products')
  async exportProducts(@Res() res: Response) {
    const csv = await this.financeService.exportProductsCsv();
    res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="products-export.csv"' });
    res.send(csv);
  }

  @Get('export/vendors')
  async exportVendors(@Res() res: Response) {
    const csv = await this.financeService.exportVendorsCsv();
    res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="vendors-export.csv"' });
    res.send(csv);
  }

  @Get('export/expenses')
  async exportExpenses(@Query() query: any, @Res() res: Response) {
    const csv = await this.financeService.exportExpensesCsv(query);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="expenses-export.csv"',
    });
    res.send(csv);
  }

  // ─── CSV Import ──────────────────────────────────────────

  @Post('import/vendors')
  @UseInterceptors(FileInterceptor('file'))
  async importVendors(@UploadedFile() file: any, @Body('data') dataStr?: string) {
    const rows = this.parseImportInput(file, dataStr);
    return this.financeService.importVendors(rows);
  }

  @Post('import/products')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any, @Body('data') dataStr?: string) {
    const rows = this.parseImportInput(file, dataStr);
    return this.financeService.importProducts(rows);
  }

  @Post('import/expenses')
  @UseInterceptors(FileInterceptor('file'))
  async importExpenses(@UploadedFile() file: any, @Body('data') dataStr?: string) {
    const rows = this.parseImportInput(file, dataStr);
    return this.financeService.importExpenses(rows);
  }

  private parseImportInput(file: any, dataStr?: string): Record<string, string>[] {
    if (file) return this.parseCsv(file.buffer.toString('utf-8'));
    if (dataStr) return JSON.parse(dataStr);
    throw new BadRequestException('No file or data provided');
  }

  private parseCsv(content: string): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  }
}
