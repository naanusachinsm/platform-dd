import { IsString, MinLength } from 'class-validator';

export class AiParseTicketDto {
  @IsString()
  @MinLength(5)
  text: string;
}
