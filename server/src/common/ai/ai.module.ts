import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiConfig } from './ai.config';
import { OpenAiProvider } from './providers/openai.provider';
import { AiDataFetcherService } from './ai-data-fetcher.service';
import { AiChatService } from './ai-chat.service';
import { AiController } from './ai.controller';

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [AiController],
  providers: [AiConfig, OpenAiProvider, AiService, AiDataFetcherService, AiChatService],
  exports: [AiService, AiConfig, AiChatService, AiDataFetcherService],
})
export class AiModule {}
