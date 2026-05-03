import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductType } from '../entities/fin-product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  unitPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
