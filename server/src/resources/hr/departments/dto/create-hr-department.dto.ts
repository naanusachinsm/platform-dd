import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HrDepartmentStatus } from '../entities/hr-department.entity';

export class CreateHrDepartmentDto {
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
  headUserId?: string;

  @IsOptional()
  @IsString()
  parentDepartmentId?: string;

  @IsOptional()
  @IsEnum(HrDepartmentStatus)
  status?: HrDepartmentStatus;
}
