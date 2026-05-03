import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { RecurringFrequency } from '../entities/fin-recurring-invoice.entity';

export class CreateRecurringInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  basedOnInvoiceId: string;

  @IsNotEmpty()
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsNotEmpty()
  @IsDateString()
  nextIssueDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
