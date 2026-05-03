import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { HrPayrollStatus } from '../entities/hr-payroll.entity';

export class CreateHrPayrollDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  month: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsNumber()
  basicSalary: number;

  @IsOptional()
  allowances?: Record<string, unknown>;

  @IsOptional()
  deductions?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  netSalary?: number;

  @IsOptional()
  @IsEnum(HrPayrollStatus)
  status?: HrPayrollStatus;
}
