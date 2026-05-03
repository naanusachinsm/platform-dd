import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Search, SquarePen, Users } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useAppStore } from "@/stores/appStore";
import type { ChatRoom } from "@/api/chatTypes";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  onNewChat: () => void;
}

export default function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    chatRooms,
    activeChatId,
    setActiveChatId,
    unreadCounts,
    loading,
  } = useChatStore();
  const user = useAppStore((s) => s.user);
  const currentUserId = user?.sub || user?.id;

  const filtered = searchTerm
    ? chatRooms.filter((room) => {
        const name = getChatName(room, currentUserId);
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : chatRooms;

  return (
    <div className="w-80 max-w-80 border-r flex flex-col bg-background h-full overflow-hidden">
      <div className="p-3 border-b space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNewChat}
            title="New chat"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chats..."
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {loading && chatRooms.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "No chats found" : "No conversations yet"}
            </p>
            {!searchTerm && (
              <Button variant="outline" size="sm" onClick={onNewChat}>
                <SquarePen className="h-3.5 w-3.5 mr-1.5" />
                Start a chat
              </Button>
            )}
          </div>
        ) : (
          <div className="py-1 overflow-hidden">
            {filtered.map((room) => (
              <ChatListItem
                key={room.id}
                room={room}
                isActive={activeChatId === room.id}
                unreadCount={unreadCounts[room.id] || 0}
                currentUserId={currentUserId}
                onClick={() => setActiveChatId(room.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatListItem({
  room,
  isActive,
  unreadCount,
  currentUserId,
  onClick,
}: {
  room: ChatRoom;
  isActive: boolean;
  unreadCount: number;
  currentUserId?: string;
  onClick: () => void;
}) {
  const name = getChatName(room, currentUserId);
  const avatar = getChatAvatar(room, currentUserId);
  const timeAgo = room.lastMessageAt
    ? formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: false })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors overflow-hidden ${
        isActive
          ? "bg-accent"
          : "hover:bg-muted/50"
      }`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={avatar.src} />
        <AvatarFallback className="text-sm">{avatar.fallback}</AvatarFallback>
      </Avatar>
      <div className="min-w-0" style={{ width: "calc(100% - 52px)" }}>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm block truncate capitalize ${
              unreadCount > 0 ? "font-semibold" : "font-medium"
            }`}
          >
            {name}
          </span>
          {timeAgo && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2 whitespace-nowrap">
              {timeAgo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p
            className={`text-xs block truncate ${
              unreadCount > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {room.lastMessagePreview || (
              <span className="italic">No messages yet</span>
            )}
          </p>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 flex items-center justify-center text-[10px] rounded-full px-1.5 flex-shrink-0"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function getChatName(room: ChatRoom, currentUserId?: string): string {
  if (room.type === "GROUP") {
    return room.name || "Group Chat";
  }
  const otherMember = room.members?.find((m) => m.userId !== currentUserId);
  if (otherMember?.user) {
    return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
  }
  return "Chat";
}

function getChatAvatar(
  room: ChatRoom,
  currentUserId?: string
): { src?: string; fallback: string } {
  if (room.type === "GROUP") {
    return {
      src: room.avatarUrl,
      fallback: (room.name || "G")[0].toUpperCase(),
    };
  }
  const otherMember = room.members?.find((m) => m.userId !== currentUserId);
  if (otherMember?.user) {
    return {
      src: otherMember.user.avatarUrl,
      fallback: `${otherMember.user.firstName?.[0] || ""}${otherMember.user.lastName?.[0] || ""}`,
    };
  }
  return { fallback: "?" };
}
