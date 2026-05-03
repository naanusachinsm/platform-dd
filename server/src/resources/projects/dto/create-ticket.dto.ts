import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketType, TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType = TicketType.TASK;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.MEDIUM;

  @IsOptional()
  @IsUUID()
  columnId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  storyPoints?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
