import { IsString, IsOptional, IsUUID, IsArray, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketType, TicketPriority } from '../entities/ticket.entity';

export class CreateBoardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsUUID()
  filterSprintId?: string;

  @IsOptional()
  @IsEnum(TicketType)
  filterType?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  filterPriority?: string;

  @IsOptional()
  @IsUUID()
  filterAssigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filterLabels?: string[];
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsUUID()
  filterSprintId?: string;

  @IsOptional()
  @IsEnum(TicketType)
  filterType?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  filterPriority?: string;

  @IsOptional()
  @IsUUID()
  filterAssigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filterLabels?: string[];
}
