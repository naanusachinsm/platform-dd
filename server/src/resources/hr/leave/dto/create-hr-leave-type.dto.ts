import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HrLeaveTypeStatus } from '../entities/hr-leave-type.entity';

export class CreateHrLeaveTypeDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  defaultDays?: number;

  @IsOptional()
  @IsBoolean()
  carryForward?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsEnum(HrLeaveTypeStatus)
  status?: HrLeaveTypeStatus;
}
