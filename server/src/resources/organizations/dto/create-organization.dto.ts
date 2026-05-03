import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  Length,
  IsObject,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Domain must be a valid domain name (e.g., example.com)',
  })
  domain?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;

  @IsOptional()
  @IsObject()
  settings?: object;

  @IsNotEmpty()
  @IsEmail()
  billingEmail: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @IsUrl({ require_protocol: true }, { message: 'Website must be a valid URL (e.g., https://example.com)' })
  website?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

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
  @Matches(/^[a-zA-Z0-9\s-]+$/, { message: 'Postal code contains invalid characters' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  @Matches(/^[0-9+\-() ]+$/, { message: 'Phone number contains invalid characters' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
