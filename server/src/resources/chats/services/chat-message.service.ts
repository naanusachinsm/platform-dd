import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatMessageRepository } from '../chat-message.repository';
import { ChatRoomRepository } from '../chat-room.repository';
import { ChatRoomMemberRepository } from '../chat-room-member.repository';
import { ChatMessage, ChatMessageType } from '../entities/chat-message.entity';
import { ChatRoomMember } from '../entities/chat-room-member.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { WsGateway } from 'src/resources/ws/ws.gateway';
import { SendMessageDto } from '../dto/send-message.dto';
import { MessageQueryDto } from '../dto/chat-query.dto';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly chatRoomMemberRepository: ChatRoomMemberRepository,
    private readonly userContextService: UserContextService,
    private readonly transactionManager: TransactionManager,
    private readonly wsGateway: WsGateway,
  ) {}

  async findAll(chatRoomId: string, query: MessageQueryDto) {
    const user = this.userContextService.getCurrentUser();

    const membership = await this.chatRoomMemberRepository.findOne({
      where: { chatRoomId, userId: user?.sub } as any,
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return this.chatMessageRepository.findAll({
      where: { chatRoomId } as any,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
      bypassTenantFilter: true,
    });
  }

  async create(chatRoomId: string, dto: SendMessageDto) {
    const user = this.userContextService.getCurrentUser();
    const currentUserId = user?.sub;

    const membership = await this.chatRoomMemberRepository.findOne({
      where: { chatRoomId, userId: currentUserId } as any,
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return this.transactionManager.execute(async (transaction) => {
      const message = await this.chatMessageRepository.create(
        {
          chatRoomId,
          senderId: currentUserId,
          content: dto.content,
          type: ChatMessageType.TEXT,
        } as any,
        transaction,
      );

      const preview = dto.content.length > 100
        ? dto.content.substring(0, 100) + '...'
        : dto.content;

      await this.chatRoomRepository.update(
        { id: chatRoomId } as any,
        {
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
        } as any,
        transaction,
      );

      await this.chatRoomMemberRepository.update(
        { chatRoomId, userId: currentUserId } as any,
        { lastReadAt: new Date() } as any,
        transaction,
      );

      return message;
    }).then(async (message) => {
      const fullMessage = await this.chatMessageRepository.findOne({
        where: { id: (message as any).id } as any,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          },
        ],
      });

      this.wsGateway.emitNewMessage(chatRoomId, fullMessage).catch(() => {});

      return fullMessage;
    });
  }

  async delete(messageId: string) {
    const user = this.userContextService.getCurrentUser();
    const message = await this.chatMessageRepository.findById(messageId) as any;
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== user?.sub) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.chatMessageRepository.delete({ id: messageId } as any);
  }
}
