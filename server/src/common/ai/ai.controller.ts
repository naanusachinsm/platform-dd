import { Controller, Post, Body } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChatHistoryItemDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

class AiGlobalChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  conversationHistory?: ChatHistoryItemDto[];

  @IsOptional()
  @IsString()
  projectId?: string;
}

@Controller()
export class AiController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  chat(@Body() dto: AiGlobalChatDto) {
    return this.aiChatService.chat({
      message: dto.message,
      conversationHistory: dto.conversationHistory,
      context: dto.projectId ? { projectId: dto.projectId } : {},
    });
  }
}
