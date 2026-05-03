import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InvoiceStatus, DiscountType } from '../entities/fin-invoice.entity';

export class CreateInvoiceItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  unitPrice: number;

  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  crmCompanyId?: string;

  @IsOptional()
  @IsUUID()
  crmContactId?: string;

  @IsOptional()
  @IsUUID()
  crmDealId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  discountAmount?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerEmail?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
