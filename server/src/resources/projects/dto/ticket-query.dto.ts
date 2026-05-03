import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { TicketType, TicketPriority } from '../entities/ticket.entity';

export class TicketQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  columnId?: string;
}
