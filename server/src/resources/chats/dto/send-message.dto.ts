import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @Transform(({ value }) => value?.trim())
  content: string;
}
