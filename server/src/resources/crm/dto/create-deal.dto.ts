import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DealStage, DealPriority } from '../entities/crm-deal.entity';

export class CreateDealDto {
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value != null ? parseFloat(value) : undefined)
  value?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => value != null ? parseInt(value, 10) : undefined)
  probability?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsDateString()
  actualCloseDate?: string;

  @IsOptional()
  @IsEnum(DealPriority)
  priority?: DealPriority;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateDealStageDto {
  @IsNotEmpty()
  @IsEnum(DealStage)
  stage: DealStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value != null ? parseInt(value, 10) : undefined)
  position?: number;
}
