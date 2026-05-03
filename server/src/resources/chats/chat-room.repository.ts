import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom } from './entities/chat-room.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ChatRoomRepository extends BaseRepository<ChatRoom> {
  constructor(
    @InjectModel(ChatRoom)
    chatRoomModel: typeof ChatRoom,
    userContextService: UserContextService,
  ) {
    super(chatRoomModel, undefined, userContextService);
  }
}
