import { IsString, IsOptional, IsArray, IsEnum, IsUUID, MinLength, MaxLength, ArrayMinSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatRoomType } from '../entities/chat-room.entity';

export class CreateChatRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  memberIds: string[];
}
