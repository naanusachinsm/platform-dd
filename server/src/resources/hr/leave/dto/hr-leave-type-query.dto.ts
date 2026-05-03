import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrLeaveTypeStatus } from '../entities/hr-leave-type.entity';

export class HrLeaveTypeQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrLeaveTypeStatus)
  status?: HrLeaveTypeStatus;
}
