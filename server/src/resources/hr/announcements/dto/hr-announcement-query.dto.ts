import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import {
  HrAnnouncementStatus,
  HrAnnouncementType,
  HrAnnouncementPriority,
} from '../entities/hr-announcement.entity';

export class HrAnnouncementQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrAnnouncementStatus)
  status?: HrAnnouncementStatus;

  @IsOptional()
  @IsEnum(HrAnnouncementType)
  type?: HrAnnouncementType;

  @IsOptional()
  @IsEnum(HrAnnouncementPriority)
  priority?: HrAnnouncementPriority;
}
