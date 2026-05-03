import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMessage } from './entities/chat-message.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  constructor(
    @InjectModel(ChatMessage)
    chatMessageModel: typeof ChatMessage,
    userContextService: UserContextService,
  ) {
    super(chatMessageModel, undefined, userContextService);
  }
}
