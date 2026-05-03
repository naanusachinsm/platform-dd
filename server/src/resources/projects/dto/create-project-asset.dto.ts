import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateProjectAssetDto {
  @IsString()
  @MaxLength(2048)
  url: string;

  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  @MaxLength(255)
  originalname: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimetype?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;
}
