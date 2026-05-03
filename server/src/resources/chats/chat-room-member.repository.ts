import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ChatRoomMemberRepository extends BaseRepository<ChatRoomMember> {
  constructor(
    @InjectModel(ChatRoomMember)
    chatRoomMemberModel: typeof ChatRoomMember,
    userContextService: UserContextService,
  ) {
    super(chatRoomMemberModel, undefined, userContextService);
  }
}
