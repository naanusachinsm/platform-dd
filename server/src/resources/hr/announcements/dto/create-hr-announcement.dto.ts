import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  HrAnnouncementType,
  HrAnnouncementPriority,
  HrAnnouncementStatus,
} from '../entities/hr-announcement.entity';

export class CreateHrAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(HrAnnouncementType)
  type?: HrAnnouncementType;

  @IsOptional()
  @IsEnum(HrAnnouncementPriority)
  priority?: HrAnnouncementPriority;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsEnum(HrAnnouncementStatus)
  status?: HrAnnouncementStatus;
}
