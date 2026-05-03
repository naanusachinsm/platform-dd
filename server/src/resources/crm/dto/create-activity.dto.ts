import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  Length,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ActivityType, ActivityStatus } from '../entities/crm-activity.entity';

export class CreateActivityDto {
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  subject: string;

  @IsOptional()
  @IsString()
  @Length(0, 10000)
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  activityDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value != null ? parseInt(value, 10) : undefined)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isReminder?: boolean;
}
