import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrLeaveRequestStatus } from '../entities/hr-leave-request.entity';

export class HrLeaveQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrLeaveRequestStatus)
  status?: HrLeaveRequestStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  leaveTypeId?: string;
}
