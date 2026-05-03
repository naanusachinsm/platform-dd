import { IsString, IsOptional } from 'class-validator';

export class AiEnhanceTicketDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
