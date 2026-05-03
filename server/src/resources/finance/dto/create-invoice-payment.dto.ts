import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../entities/fin-invoice-payment.entity';

export class CreateInvoicePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
