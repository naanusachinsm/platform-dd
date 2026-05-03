import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HrDesignationStatus } from '../entities/hr-designation.entity';

export class CreateHrDesignationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsEnum(HrDesignationStatus)
  status?: HrDesignationStatus;
}
