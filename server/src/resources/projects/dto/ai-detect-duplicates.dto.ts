import { IsString, IsOptional } from 'class-validator';

export class AiDetectDuplicatesDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
