import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { HrLeaveRequestStatus } from '../entities/hr-leave-request.entity';

export class CreateHrLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  leaveTypeId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsNotEmpty()
  @IsNumber()
  daysCount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(HrLeaveRequestStatus)
  status?: HrLeaveRequestStatus;
}
