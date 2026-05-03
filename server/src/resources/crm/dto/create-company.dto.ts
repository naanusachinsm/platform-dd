import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CompanySize, CompanyStatus } from '../entities/crm-company.entity';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  industry?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  website?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  country?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value != null ? parseFloat(value) : undefined)
  annualRevenue?: number;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  notes?: string;
}
