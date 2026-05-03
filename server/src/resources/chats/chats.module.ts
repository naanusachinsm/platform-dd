import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { ChatsController } from './chats.controller';
import { ChatRoomService } from './services/chat-room.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatRoomRepository } from './chat-room.repository';
import { ChatRoomMemberRepository } from './chat-room-member.repository';
import { ChatMessageRepository } from './chat-message.repository';
import { WsModule } from 'src/resources/ws/ws.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ChatRoom,
      ChatRoomMember,
      ChatMessage,
      User,
    ]),
    WsModule,
  ],
  controllers: [ChatsController],
  providers: [
    ChatRoomService,
    ChatMessageService,
    ChatRoomRepository,
    ChatRoomMemberRepository,
    ChatMessageRepository,
  ],
  exports: [ChatRoomService, ChatMessageService],
})
export class ChatsModule {}
