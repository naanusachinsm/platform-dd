import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateHrLeaveRequestDto } from './create-hr-leave-request.dto';
import { HrLeaveRequestStatus } from '../entities/hr-leave-request.entity';

export class UpdateHrLeaveRequestDto extends PartialType(CreateHrLeaveRequestDto) {
  @IsOptional()
  @IsEnum(HrLeaveRequestStatus)
  status?: HrLeaveRequestStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
