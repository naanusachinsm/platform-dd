import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrPayrollStatus } from '../entities/hr-payroll.entity';

export class HrPayrollQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrPayrollStatus)
  status?: HrPayrollStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  @IsNumber()
  year?: number;
}
