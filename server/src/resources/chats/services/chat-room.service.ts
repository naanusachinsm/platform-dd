import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatRoomRepository } from '../chat-room.repository';
import { ChatRoomMemberRepository } from '../chat-room-member.repository';
import { ChatMessageRepository } from '../chat-message.repository';
import { ChatRoom, ChatRoomType } from '../entities/chat-room.entity';
import { ChatRoomMember, ChatMemberRole } from '../entities/chat-room-member.entity';
import { ChatMessage, ChatMessageType } from '../entities/chat-message.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { UpdateChatRoomDto } from '../dto/update-chat-room.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';
import { AddChatMemberDto } from '../dto/add-chat-member.dto';
import { Op } from 'sequelize';

@Injectable()
export class ChatRoomService {
  private readonly logger = new Logger(ChatRoomService.name);

  constructor(
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly chatRoomMemberRepository: ChatRoomMemberRepository,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly userContextService: UserContextService,
    private readonly transactionManager: TransactionManager,
  ) {}

  async create(dto: CreateChatRoomDto) {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;
    const currentUserId = user?.sub;

    const allMemberIds = [...new Set([currentUserId, ...dto.memberIds])];

    if (dto.type === ChatRoomType.DIRECT) {
      if (allMemberIds.length !== 2) {
        throw new BadRequestException('Direct chat must have exactly 2 members');
      }

      const existingRoom = await this.findExistingDirectChat(
        allMemberIds[0],
        allMemberIds[1],
        organizationId,
      );
      if (existingRoom) {
        return existingRoom;
      }
    }

    return this.transactionManager.execute(async (transaction) => {
      const chatRoom = await this.chatRoomRepository.create(
        {
          organizationId,
          name: dto.name || null,
          type: dto.type,
        } as any,
        transaction,
      );

      const roomId = (chatRoom as any).id;

      for (const memberId of allMemberIds) {
        await this.chatRoomMemberRepository.create(
          {
            chatRoomId: roomId,
            userId: memberId,
            role: memberId === currentUserId ? ChatMemberRole.OWNER : ChatMemberRole.MEMBER,
            lastReadAt: new Date(),
          } as any,
          transaction,
        );
      }

      return chatRoom;
    }).then(async (chatRoom) => {
      return this.findOne((chatRoom as any).id);
    });
  }

  async findAllForUser(query: ChatQueryDto) {
    const user = this.userContextService.getCurrentUser();
    const currentUserId = user?.sub;

    const memberships = await ChatRoomMember.findAll({
      where: { userId: currentUserId },
      attributes: ['chatRoomId'],
      paranoid: true,
    });

    const roomIds = memberships.map((m) => m.chatRoomId);
    if (roomIds.length === 0) {
      return { data: [], total: 0, page: 1, limit: query.limit, totalPages: 0 };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause: any = { id: { [Op.in]: roomIds } };
    if (query.searchTerm) {
      whereClause.name = { [Op.like]: `%${query.searchTerm}%` };
    }

    const { rows, count } = await ChatRoom.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['lastMessageAt', 'DESC']],
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
          ],
        },
      ],
    });

    const data = rows.map((room) => {
      const plain = room.get({ plain: true }) as any;
      const currentMember = plain.members?.find((m: any) => m.userId === currentUserId);
      return {
        ...plain,
        unreadCount: 0,
        lastReadAt: currentMember?.lastReadAt,
      };
    });

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id } as any,
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
          ],
        },
      ],
    });
    if (!room) throw new NotFoundException('Chat room not found');
    return room;
  }

  async update(id: string, dto: UpdateChatRoomDto) {
    const room = await this.chatRoomRepository.findById(id) as any;
    if (!room) throw new NotFoundException('Chat room not found');
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot update a direct chat');
    }

    await this.chatRoomRepository.update({ id } as any, dto as any);
    return this.findOne(id);
  }

  async leaveRoom(id: string) {
    const user = this.userContextService.getCurrentUser();
    const member = await this.chatRoomMemberRepository.findOne({
      where: { chatRoomId: id, userId: user?.sub } as any,
    });
    if (!member) throw new NotFoundException('You are not a member of this chat');

    return this.chatRoomMemberRepository.forceDelete({
      chatRoomId: id,
      userId: user?.sub,
    } as any);
  }

  async addMembers(chatRoomId: string, dto: AddChatMemberDto) {
    const room = await this.chatRoomRepository.findById(chatRoomId) as any;
    if (!room) throw new NotFoundException('Chat room not found');
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot add members to a direct chat');
    }

    const user = this.userContextService.getCurrentUser();

    return this.transactionManager.execute(async (transaction) => {
      for (const userId of dto.userIds) {
        const existing = await this.chatRoomMemberRepository.findOne({
          where: { chatRoomId, userId } as any,
        });
        if (!existing) {
          await this.chatRoomMemberRepository.create(
            {
              chatRoomId,
              userId,
              role: ChatMemberRole.MEMBER,
              lastReadAt: new Date(),
            } as any,
            transaction,
          );

          await this.chatMessageRepository.create(
            {
              chatRoomId,
              senderId: user?.sub,
              content: `added a new member to the group`,
              type: ChatMessageType.SYSTEM,
            } as any,
            transaction,
          );
        }
      }

      return this.findOne(chatRoomId);
    });
  }

  async removeMember(chatRoomId: string, userId: string) {
    const room = await this.chatRoomRepository.findById(chatRoomId) as any;
    if (!room) throw new NotFoundException('Chat room not found');
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot remove members from a direct chat');
    }

    const member = await this.chatRoomMemberRepository.findOne({
      where: { chatRoomId, userId } as any,
    });
    if (!member) throw new NotFoundException('User is not a member of this chat');

    return this.chatRoomMemberRepository.forceDelete({
      chatRoomId,
      userId,
    } as any);
  }

  async markAsRead(chatRoomId: string) {
    const user = this.userContextService.getCurrentUser();
    return this.chatRoomMemberRepository.update(
      { chatRoomId, userId: user?.sub } as any,
      { lastReadAt: new Date() } as any,
    );
  }

  async getUnreadCounts() {
    const user = this.userContextService.getCurrentUser();
    const currentUserId = user?.sub;

    const memberships = await ChatRoomMember.findAll({
      where: { userId: currentUserId },
      attributes: ['chatRoomId', 'lastReadAt'],
      paranoid: true,
    });

    const counts: Record<string, number> = {};
    for (const membership of memberships) {
      const lastReadAt = membership.lastReadAt || new Date(0);
      const messageCount = await ChatMessage.count({
        where: {
          chatRoomId: membership.chatRoomId,
          senderId: { [Op.ne]: currentUserId },
          createdAt: { [Op.gt]: lastReadAt },
        },
      });
      if (messageCount > 0) {
        counts[membership.chatRoomId] = messageCount;
      }
    }

    return counts;
  }

  private async findExistingDirectChat(
    userId1: string,
    userId2: string,
    organizationId: string,
  ) {
    const member1Rooms = await this.chatRoomMemberRepository.findAll({
      where: { userId: userId1 } as any,
      pagination: { page: 1, limit: 500 },
      bypassTenantFilter: true,
    });

    const room1Ids = (member1Rooms.data as any[]).map((m) => m.chatRoomId);
    if (room1Ids.length === 0) return null;

    const member2Rooms = await this.chatRoomMemberRepository.findAll({
      where: {
        userId: userId2,
        chatRoomId: { [Op.in]: room1Ids },
      } as any,
      pagination: { page: 1, limit: 500 },
      bypassTenantFilter: true,
    });

    const commonRoomIds = (member2Rooms.data as any[]).map((m) => m.chatRoomId);
    if (commonRoomIds.length === 0) return null;

    for (const roomId of commonRoomIds) {
      const room = await this.chatRoomRepository.findOne({
        where: {
          id: roomId,
          type: ChatRoomType.DIRECT,
          organizationId,
        } as any,
        include: [
          {
            model: ChatRoomMember,
            as: 'members',
            include: [
              { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
            ],
          },
        ],
      });
      if (room) return room;
    }

    return null;
  }
}
