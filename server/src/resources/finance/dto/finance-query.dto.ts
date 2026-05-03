import { IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { ProductType } from '../entities/fin-product.entity';
import { TaxRateType } from '../entities/fin-tax-rate.entity';
import { InvoiceStatus } from '../entities/fin-invoice.entity';
import { EstimateStatus } from '../entities/fin-estimate.entity';
import { RecurringFrequency } from '../entities/fin-recurring-invoice.entity';
import { PaymentMethod } from '../entities/fin-invoice-payment.entity';
import { ReimbursementStatus } from '../entities/fin-expense.entity';

export class ProductQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;
}

export class TaxRateQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TaxRateType)
  type?: TaxRateType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;
}

export class VendorQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  crmCompanyId?: string;
}

export class InvoiceQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  crmCompanyId?: string;

  @IsOptional()
  @IsUUID()
  crmContactId?: string;

  @IsOptional()
  @IsString()
  dateRange?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class EstimateQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(EstimateStatus)
  status?: EstimateStatus;

  @IsOptional()
  @IsUUID()
  crmCompanyId?: string;

  @IsOptional()
  @IsUUID()
  crmContactId?: string;

  @IsOptional()
  @IsString()
  dateRange?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class RecurringInvoiceQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;
}

export class ExpenseCategoryQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;
}

export class ExpenseQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(ReimbursementStatus)
  reimbursementStatus?: ReimbursementStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isReimbursable?: boolean;

  @IsOptional()
  @IsString()
  dateRange?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class InvoicePaymentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
