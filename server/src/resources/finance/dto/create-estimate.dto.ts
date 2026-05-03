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
import { EstimateStatus } from '../entities/fin-estimate.entity';
import { DiscountType } from '../entities/fin-invoice.entity';
import { CreateInvoiceItemDto } from './create-invoice.dto';

export class CreateEstimateDto {
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
  @IsEnum(EstimateStatus)
  status?: EstimateStatus;

  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

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
