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
import {
  HrDocumentType,
  HrDocumentStatus,
} from '../entities/hr-document.entity';

export class CreateHrDocumentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsEnum(HrDocumentType)
  documentType?: HrDocumentType;

  @IsNotEmpty()
  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(HrDocumentStatus)
  status?: HrDocumentStatus;
}
