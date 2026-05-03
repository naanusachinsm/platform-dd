import { IsString, IsOptional, IsUUID, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z][A-Z0-9]*$/, {
    message: 'Key must be uppercase letters and numbers, starting with a letter (e.g. SCANVIEW)',
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  leadUserId?: string;
}
