import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class AgentChatDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class ConfirmActionDto {
  @IsNotEmpty()
  @IsBoolean()
  confirmed: boolean;
}

export class MemoryQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
