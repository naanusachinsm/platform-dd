import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChatRoomService } from './services/chat-room.service';
import { ChatMessageService } from './services/chat-message.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatQueryDto, MessageQueryDto } from './dto/chat-query.dto';
import { AddChatMemberDto } from './dto/add-chat-member.dto';

@Controller()
export class ChatsController {
  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly chatMessageService: ChatMessageService,
  ) {}

  @Get()
  findAllRooms(@Query() query: ChatQueryDto) {
    return this.chatRoomService.findAllForUser(query);
  }

  @Post()
  createRoom(@Body() dto: CreateChatRoomDto) {
    return this.chatRoomService.create(dto);
  }

  @Get('unread-counts')
  getUnreadCounts() {
    return this.chatRoomService.getUnreadCounts();
  }

  @Get(':chatRoomId')
  findOneRoom(@Param('chatRoomId') chatRoomId: string) {
    return this.chatRoomService.findOne(chatRoomId);
  }

  @Put(':chatRoomId')
  updateRoom(
    @Param('chatRoomId') chatRoomId: string,
    @Body() dto: UpdateChatRoomDto,
  ) {
    return this.chatRoomService.update(chatRoomId, dto);
  }

  @Delete(':chatRoomId')
  leaveRoom(@Param('chatRoomId') chatRoomId: string) {
    return this.chatRoomService.leaveRoom(chatRoomId);
  }

  @Post(':chatRoomId/members')
  addMembers(
    @Param('chatRoomId') chatRoomId: string,
    @Body() dto: AddChatMemberDto,
  ) {
    return this.chatRoomService.addMembers(chatRoomId, dto);
  }

  @Delete(':chatRoomId/members/:userId')
  removeMember(
    @Param('chatRoomId') chatRoomId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatRoomService.removeMember(chatRoomId, userId);
  }

  @Get(':chatRoomId/messages')
  findMessages(
    @Param('chatRoomId') chatRoomId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatMessageService.findAll(chatRoomId, query);
  }

  @Post(':chatRoomId/messages')
  sendMessage(
    @Param('chatRoomId') chatRoomId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatMessageService.create(chatRoomId, dto);
  }

  @Put(':chatRoomId/read')
  markAsRead(@Param('chatRoomId') chatRoomId: string) {
    return this.chatRoomService.markAsRead(chatRoomId);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string) {
    return this.chatMessageService.delete(messageId);
  }
}
