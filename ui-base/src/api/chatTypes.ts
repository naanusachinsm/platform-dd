export const ChatRoomType = {
  DIRECT: "DIRECT",
  GROUP: "GROUP",
} as const;
export type ChatRoomType = (typeof ChatRoomType)[keyof typeof ChatRoomType];

export const ChatMessageType = {
  TEXT: "TEXT",
  SYSTEM: "SYSTEM",
  CALL: "CALL",
} as const;
export type ChatMessageType =
  (typeof ChatMessageType)[keyof typeof ChatMessageType];

export const ChatMemberRole = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
} as const;
export type ChatMemberRole =
  (typeof ChatMemberRole)[keyof typeof ChatMemberRole];

export interface ChatUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChatRoomMember {
  id: string;
  chatRoomId: string;
  userId: string;
  role: ChatMemberRole;
  lastReadAt?: string;
  user?: ChatUserSummary;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  organizationId: string;
  name?: string;
  type: ChatRoomType;
  avatarUrl?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  members?: ChatRoomMember[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: ChatMessageType;
  sender?: ChatUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRoomRequest {
  name?: string;
  type: ChatRoomType;
  memberIds: string[];
}

export interface SendMessageRequest {
  content: string;
}

export interface AddChatMembersRequest {
  userIds: string[];
}

export interface UpdateChatRoomRequest {
  name?: string;
  avatarUrl?: string;
}
