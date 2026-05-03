import { create } from "zustand";
import type { ChatRoom, ChatMessage } from "@/api/chatTypes";
import { chatService } from "@/api/chatService";

interface ChatState {
  chatRooms: ChatRoom[];
  activeChatId: string | null;
  messages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, { userId: string; userName: string }[]>;
  loading: boolean;
  messagesLoading: boolean;

  setChatRooms: (rooms: ChatRoom[]) => void;
  setActiveChatId: (id: string | null) => void;
  setMessages: (chatRoomId: string, messages: ChatMessage[]) => void;
  addMessage: (chatRoomId: string, message: ChatMessage) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (chatRoomId: string) => void;
  clearUnread: (chatRoomId: string) => void;
  setTypingUser: (chatRoomId: string, userId: string, userName: string) => void;
  removeTypingUser: (chatRoomId: string, userId: string) => void;
  setLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;

  fetchChatRooms: () => Promise<void>;
  fetchMessages: (chatRoomId: string, page?: number) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  updateRoomPreview: (chatRoomId: string, preview: string, timestamp: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chatRooms: [],
  activeChatId: null,
  messages: {},
  unreadCounts: {},
  typingUsers: {},
  loading: false,
  messagesLoading: false,

  setChatRooms: (chatRooms) => set({ chatRooms }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  setMessages: (chatRoomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatRoomId]: messages },
    })),
  addMessage: (chatRoomId, message) =>
    set((state) => {
      const existing = state.messages[chatRoomId] || [];
      const alreadyExists = existing.some((m) => m.id === message.id);
      if (alreadyExists) return state;
      return {
        messages: {
          ...state.messages,
          [chatRoomId]: [...existing, message],
        },
      };
    }),
  setUnreadCounts: (unreadCounts) => set({ unreadCounts }),
  incrementUnread: (chatRoomId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatRoomId]: (state.unreadCounts[chatRoomId] || 0) + 1,
      },
    })),
  clearUnread: (chatRoomId) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts };
      delete newCounts[chatRoomId];
      return { unreadCounts: newCounts };
    }),
  setTypingUser: (chatRoomId, userId, userName) =>
    set((state) => {
      const current = state.typingUsers[chatRoomId] || [];
      if (current.some((u) => u.userId === userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatRoomId]: [...current, { userId, userName }],
        },
      };
    }),
  removeTypingUser: (chatRoomId, userId) =>
    set((state) => {
      const current = state.typingUsers[chatRoomId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatRoomId]: current.filter((u) => u.userId !== userId),
        },
      };
    }),
  setLoading: (loading) => set({ loading }),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),

  fetchChatRooms: async () => {
    set({ loading: true });
    try {
      const response = await chatService.getChatRooms({ limit: 100 });
      if (response.success && response.data) {
        const sorted = [...response.data.data].sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return tb - ta;
        });
        set({ chatRooms: sorted });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (chatRoomId, page = 1) => {
    set({ messagesLoading: true });
    try {
      const response = await chatService.getMessages(chatRoomId, {
        page,
        limit: 100,
      });
      if (response.success && response.data) {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatRoomId]: response.data!.data,
          },
        }));
      }
    } finally {
      set({ messagesLoading: false });
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const response = await chatService.getUnreadCounts();
      if (response.success && response.data) {
        set({ unreadCounts: response.data });
      }
    } catch {
      // silently ignore
    }
  },

  updateRoomPreview: (chatRoomId, preview, timestamp) =>
    set((state) => ({
      chatRooms: state.chatRooms
        .map((room) =>
          room.id === chatRoomId
            ? { ...room, lastMessagePreview: preview, lastMessageAt: timestamp }
            : room
        )
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        }),
    })),
}));
