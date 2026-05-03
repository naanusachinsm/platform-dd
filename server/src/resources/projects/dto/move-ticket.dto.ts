import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class MoveTicketDto {
  @IsUUID()
  columnId: string;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  position: number;
}

export class AssignTicketDto {
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
