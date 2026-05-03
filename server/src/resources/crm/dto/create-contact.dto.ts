import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ContactStatus, ContactSource } from '../entities/crm-contact.entity';

export class CreateContactDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  @Transform(({ value }) => value?.replace(/<[^>]*>/g, '').trim())
  jobTitle?: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastContactedAt?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
