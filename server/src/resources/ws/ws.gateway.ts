import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { WsService } from './ws.service';
import { CreateWDto } from './dto/create-w.dto';
import { Socket } from 'socket.io';
import { UpdateWDto } from './dto/update-w.dto';
import { Server } from 'socket.io';
import { RedisProgressService } from 'src/common/services/redis-progress.service';
import { ChatMessage, ChatMessageType } from 'src/resources/chats/entities/chat-message.entity';
import { ChatRoom } from 'src/resources/chats/entities/chat-room.entity';
import { User } from 'src/resources/users/entities/user.entity';

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:4200',
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Alternative Vite port
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private userSockets = new Map<string, string>();
  private socketUsers = new Map<string, string>();
  private activeCalls = new Map<string, Set<string>>();
  private callMeta = new Map<string, { startedAt: number; callType: string; callerId: string }>();

  constructor(
    private readonly wsService: WsService,
    private readonly redisProgressService: RedisProgressService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    // Subscribe to Redis progress updates and forward to WebSocket clients
    this.redisProgressService.subscribeToProgress((fileId, progress) => {
      console.log(
        `📡 Received progress from Redis for ${fileId}, forwarding to WebSocket clients`,
      );
      this.server
        ?.to(`upload-${fileId}`)
        .emit(`upload-progress-${fileId}`, progress);
      this.server?.emit(`upload-progress-${fileId}`, progress);
    });
  }

  handleConnection(client: Socket) {
    console.log(
      `🔌 Client connected: ${client.id} from ${client.handshake.address}`,
    );
    console.log(`🌐 Client origin: ${client.handshake.headers.origin}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);

      for (const [chatRoomId, participants] of this.activeCalls.entries()) {
        if (participants.has(userId)) {
          participants.delete(userId);
          this.server.to(`call-${chatRoomId}`).emit('call-user-left', {
            chatRoomId,
            userId,
          });
          if (participants.size === 0) {
            this.activeCalls.delete(chatRoomId);
            this.saveCallMessage(chatRoomId).catch(() => {});
          }
        }
      }
    }
  }

  @SubscribeMessage('message1')
  handleMessage(@MessageBody() message: string): void {
    console.log('Received message:', message);
    this.server.emit('message', `Server received: ${message}`); // Broadcast to all clients
  }

  @SubscribeMessage('test-connection')
  handleTestConnection(client: Socket): void {
    console.log('🧪 Test connection received from:', client.id);
    client.emit('test-response', {
      message: 'WebSocket connection is working!',
      timestamp: new Date().toISOString(),
      clientId: client.id,
    });
  }

  // Method to emit upload progress updates
  async emitUploadProgress(fileId: string, progress: any) {
    console.log(`📊 Emitting progress for fileId: ${fileId}`, progress);

    // If running in worker process (no HTTP server), publish to Redis
    if (!this.server) {
      console.log('📤 Publishing progress to Redis (worker process)');
      await this.redisProgressService.publishProgress(fileId, progress);
      return;
    }

    // If running in API server, emit directly to WebSocket clients
    this.server
      .to(`upload-${fileId}`)
      .emit(`upload-progress-${fileId}`, progress);
    // Also emit globally as fallback
    this.server.emit(`upload-progress-${fileId}`, progress);
  }

  // Method to join a specific upload room for targeted updates
  @SubscribeMessage('join-upload-room')
  handleJoinUploadRoom(client: Socket, fileId: string): void {
    client.join(`upload-${fileId}`);
    console.log(`Client ${client.id} joined upload room: upload-${fileId}`);
  }

  // Method to leave upload room
  @SubscribeMessage('leave-upload-room')
  handleLeaveUploadRoom(client: Socket, fileId: string): void {
    client.leave(`upload-${fileId}`);
    console.log(`Client ${client.id} left upload room: upload-${fileId}`);
  }

  // ===== Notification Methods =====

  /**
   * Emit notification to user-specific room
   */
  async emitNotification(userId: string, notification: any): Promise<void> {
    console.log(`📬 Emitting notification to user ${userId}:`, notification);

    // If running in worker process (no HTTP server), publish to Redis
    if (!this.server) {
      console.log('📤 Publishing notification to Redis (worker process)');
      await this.redisProgressService.publishProgress(
        `notification-${userId}`,
        notification,
      );
      return;
    }

    // If running in API server, emit directly to WebSocket clients
    this.server
      .to(`user-${userId}`)
      .emit(`notification-${userId}`, notification);
    // Also emit globally as fallback
    this.server.emit(`notification-${userId}`, notification);
  }

  /**
   * Join user-specific notification room
   */
  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(client: Socket, userId: string): void {
    client.join(`user-${userId}`);
    console.log(`Client ${client.id} joined user room: user-${userId}`);
  }

  /**
   * Leave user-specific notification room
   */
  @SubscribeMessage('leave-user-room')
  handleLeaveUserRoom(client: Socket, userId: string): void {
    client.leave(`user-${userId}`);
    console.log(`Client ${client.id} left user room: user-${userId}`);
  }

  // ===== AI Result Methods (generic, any module can use) =====

  @SubscribeMessage('join-ai-room')
  handleJoinAiRoom(client: Socket, room: string): void {
    client.join(room);
  }

  @SubscribeMessage('leave-ai-room')
  handleLeaveAiRoom(client: Socket, room: string): void {
    client.leave(room);
  }

  async emitAiResult(room: string, payload: any): Promise<void> {
    if (!this.server) return;
    this.server.to(room).emit('ai-result', payload);
  }

  // ===== Chat Methods =====

  @SubscribeMessage('join-chat-room')
  handleJoinChatRoom(client: Socket, chatRoomId: string): void {
    client.join(`chat-${chatRoomId}`);
  }

  @SubscribeMessage('leave-chat-room')
  handleLeaveChatRoom(client: Socket, chatRoomId: string): void {
    client.leave(`chat-${chatRoomId}`);
  }

  @SubscribeMessage('join-chat-rooms')
  handleJoinChatRooms(client: Socket, chatRoomIds: string[]): void {
    for (const id of chatRoomIds) {
      client.join(`chat-${id}`);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    client: Socket,
    data: { chatRoomId: string; userId: string; userName: string },
  ): void {
    client.to(`chat-${data.chatRoomId}`).emit('user-typing', {
      chatRoomId: data.chatRoomId,
      userId: data.userId,
      userName: data.userName,
    });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(
    client: Socket,
    data: { chatRoomId: string; userId: string },
  ): void {
    client.to(`chat-${data.chatRoomId}`).emit('user-stop-typing', {
      chatRoomId: data.chatRoomId,
      userId: data.userId,
    });
  }

  async emitNewMessage(chatRoomId: string, message: any): Promise<void> {
    if (!this.server) return;
    this.server.to(`chat-${chatRoomId}`).emit('new-message', {
      chatRoomId,
      message,
    });
  }

  async emitChatUpdated(chatRoomId: string, data: any): Promise<void> {
    if (!this.server) return;
    this.server.to(`chat-${chatRoomId}`).emit('chat-updated', {
      chatRoomId,
      ...data,
    });
  }

  // ===== User-Socket Registration =====

  @SubscribeMessage('register-user')
  handleRegisterUser(client: Socket, userId: string): void {
    this.userSockets.set(userId, client.id);
    this.socketUsers.set(client.id, userId);
    console.log(`📝 Registered user ${userId} with socket ${client.id} (total: ${this.userSockets.size})`);
  }

  // ===== Call / WebRTC Signaling =====

  @SubscribeMessage('call-initiate')
  async handleCallInitiate(
    client: Socket,
    data: {
      chatRoomId: string;
      userId: string;
      userName: string;
      callType: 'audio' | 'video';
    },
  ): Promise<void> {
    const roomName = `chat-${data.chatRoomId}`;
    const socketsInRoom = await this.server.in(roomName).fetchSockets();
    console.log(
      `📞 call-initiate from ${data.userName} (${client.id}) in room ${roomName}`,
    );
    console.log(
      `   Sockets in room: ${socketsInRoom.length} → [${socketsInRoom.map((s) => s.id).join(', ')}]`,
    );

    const participants = new Set<string>([data.userId]);
    this.activeCalls.set(data.chatRoomId, participants);
    this.callMeta.set(data.chatRoomId, {
      startedAt: Date.now(),
      callType: data.callType,
      callerId: data.userId,
    });

    client.join(`call-${data.chatRoomId}`);

    client.to(roomName).emit('incoming-call', {
      chatRoomId: data.chatRoomId,
      callerId: data.userId,
      callerName: data.userName,
      callType: data.callType,
    });
  }

  @SubscribeMessage('call-join')
  handleCallJoin(
    client: Socket,
    data: { chatRoomId: string; userId: string; userName: string },
  ): void {
    const participants = this.activeCalls.get(data.chatRoomId);
    if (!participants) return;

    const existingParticipants = Array.from(participants);
    participants.add(data.userId);
    client.join(`call-${data.chatRoomId}`);

    this.server.to(`call-${data.chatRoomId}`).emit('call-user-joined', {
      chatRoomId: data.chatRoomId,
      userId: data.userId,
      userName: data.userName,
      existingParticipants,
    });
  }

  @SubscribeMessage('call-offer')
  handleCallOffer(
    client: Socket,
    data: {
      chatRoomId: string;
      targetUserId: string;
      sdp: RTCSessionDescriptionInit;
      fromUserId: string;
    },
  ): void {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('call-offer', {
      chatRoomId: data.chatRoomId,
      fromUserId: data.fromUserId,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('call-answer')
  handleCallAnswer(
    client: Socket,
    data: {
      chatRoomId: string;
      targetUserId: string;
      sdp: RTCSessionDescriptionInit;
      fromUserId: string;
    },
  ): void {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('call-answer', {
      chatRoomId: data.chatRoomId,
      fromUserId: data.fromUserId,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('call-ice-candidate')
  handleCallIceCandidate(
    client: Socket,
    data: {
      chatRoomId: string;
      targetUserId: string;
      candidate: RTCIceCandidateInit;
      fromUserId: string;
    },
  ): void {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('call-ice-candidate', {
      chatRoomId: data.chatRoomId,
      fromUserId: data.fromUserId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('call-leave')
  async handleCallLeave(
    client: Socket,
    data: { chatRoomId: string; userId: string },
  ): Promise<void> {
    const participants = this.activeCalls.get(data.chatRoomId);
    if (participants) {
      participants.delete(data.userId);
      if (participants.size === 0) {
        this.activeCalls.delete(data.chatRoomId);
      }
    }

    client.leave(`call-${data.chatRoomId}`);

    this.server.to(`call-${data.chatRoomId}`).emit('call-user-left', {
      chatRoomId: data.chatRoomId,
      userId: data.userId,
    });

    if (!participants || participants.size === 0) {
      this.server.to(`chat-${data.chatRoomId}`).emit('call-ended', {
        chatRoomId: data.chatRoomId,
      });

      await this.saveCallMessage(data.chatRoomId);
    }
  }

  @SubscribeMessage('call-reject')
  handleCallReject(
    client: Socket,
    data: { chatRoomId: string; userId: string; callerId: string },
  ): void {
    const callerSocketId = this.userSockets.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call-rejected', {
        chatRoomId: data.chatRoomId,
        userId: data.userId,
      });
    }
  }

  private async saveCallMessage(chatRoomId: string): Promise<void> {
    const meta = this.callMeta.get(chatRoomId);
    if (!meta) return;
    this.callMeta.delete(chatRoomId);

    try {
      const durationSec = Math.floor((Date.now() - meta.startedAt) / 1000);
      const content = JSON.stringify({
        callType: meta.callType,
        duration: durationSec,
      });

      const message = await ChatMessage.create({
        chatRoomId,
        senderId: meta.callerId,
        content,
        type: ChatMessageType.CALL,
      });

      const preview =
        meta.callType === 'video' ? 'Video call' : 'Audio call';

      await ChatRoom.update(
        { lastMessageAt: new Date(), lastMessagePreview: preview },
        { where: { id: chatRoomId } },
      );

      const fullMessage = await ChatMessage.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          },
        ],
      });

      if (fullMessage) {
        await this.emitNewMessage(
          chatRoomId,
          fullMessage.get({ plain: true }),
        );
      }
    } catch (err) {
      console.error('Failed to save call message:', err);
    }
  }

  // ===== Agent Methods =====

  @SubscribeMessage('join-agent-room')
  handleJoinAgentRoom(client: Socket, conversationId: string): void {
    client.join(`agent-${conversationId}`);
  }

  @SubscribeMessage('leave-agent-room')
  handleLeaveAgentRoom(client: Socket, conversationId: string): void {
    client.leave(`agent-${conversationId}`);
  }

  async emitAgentResponse(
    conversationId: string,
    payload: any,
  ): Promise<void> {
    if (!this.server) return;
    this.server.to(`agent-${conversationId}`).emit('agent-response', payload);
  }

  async emitAgentToolStart(
    conversationId: string,
    payload: { toolName: string; callId: string },
  ): Promise<void> {
    if (!this.server) return;
    this.server
      .to(`agent-${conversationId}`)
      .emit('agent-tool-start', payload);
  }

  async emitAgentToolResult(
    conversationId: string,
    payload: {
      toolName: string;
      callId: string;
      success: boolean;
      durationMs: number;
    },
  ): Promise<void> {
    if (!this.server) return;
    this.server
      .to(`agent-${conversationId}`)
      .emit('agent-tool-result', payload);
  }

  async emitAgentConfirmRequired(
    conversationId: string,
    payload: { tool: string; params: any; description: string },
  ): Promise<void> {
    if (!this.server) return;
    this.server
      .to(`agent-${conversationId}`)
      .emit('agent-confirm-required', payload);
  }

  async emitAgentError(
    conversationId: string,
    payload: { message: string },
  ): Promise<void> {
    if (!this.server) return;
    this.server.to(`agent-${conversationId}`).emit('agent-error', payload);
  }

  @SubscribeMessage('call-toggle-media')
  handleCallToggleMedia(
    client: Socket,
    data: {
      chatRoomId: string;
      userId: string;
      kind: 'audio' | 'video';
      enabled: boolean;
    },
  ): void {
    client.to(`call-${data.chatRoomId}`).emit('call-media-toggled', {
      userId: data.userId,
      kind: data.kind,
      enabled: data.enabled,
    });
  }
}
