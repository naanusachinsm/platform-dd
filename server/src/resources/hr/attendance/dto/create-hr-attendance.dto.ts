import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { HrAttendanceStatus } from '../entities/hr-attendance.entity';

export class CreateHrAttendanceDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  clockIn?: string;

  @IsOptional()
  @IsString()
  clockOut?: string;

  @IsOptional()
  @IsNumber()
  totalHours?: number;

  @IsOptional()
  @IsEnum(HrAttendanceStatus)
  status?: HrAttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
