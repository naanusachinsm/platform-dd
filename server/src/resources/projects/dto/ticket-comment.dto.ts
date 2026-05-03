import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTicketCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(10000)
  content: string;
}

export class UpdateTicketCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(10000)
  content: string;
}
