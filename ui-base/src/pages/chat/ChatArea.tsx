import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquareText } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore, type CallType } from "@/stores/callStore";
import { useAppStore } from "@/stores/appStore";
import { chatService } from "@/api/chatService";
import { toast } from "sonner";
import ChatHeader from "./ChatHeader";
import ChatMessageBubble from "./ChatMessageBubble";
import CallScreen from "./CallScreen";
import type { ChatRoom } from "@/api/chatTypes";
import { getSocket } from "@/services/socket";

interface ChatAreaProps {
  chatRoom: ChatRoom | null;
  onAddMembers: () => void;
  onLeave: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onStartCall?: (callType: CallType) => void;
}

export default function ChatArea({
  chatRoom,
  onAddMembers,
  onLeave,
  onRename,
  onDelete,
  onStartCall,
}: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    messages,
    messagesLoading,
    activeChatId,
    addMessage,
    updateRoomPreview,
    typingUsers,
    fetchMessages,
    clearUnread,
  } = useChatStore();
  const user = useAppStore((s) => s.user);
  const currentUserId = user?.sub || user?.id;
  const callState = useCallStore((s) => s.callState);
  const callChatRoomId = useCallStore((s) => s.callChatRoomId);

  const currentMessages = activeChatId ? messages[activeChatId] || [] : [];
  const currentTyping = activeChatId
    ? (typingUsers[activeChatId] || []).filter(
        (u) => u.userId !== currentUserId
      )
    : [];

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      chatService.markAsRead(activeChatId).catch(() => {});
      clearUnread(activeChatId);
    }
  }, [activeChatId, fetchMessages, clearUnread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  const handleTyping = useCallback(() => {
    if (!activeChatId || !currentUserId) return;
    const socket = getSocket();
    const userName = user
      ? `${user.firstName} ${user.lastName}`
      : "Someone";

    socket.emit("typing", {
      chatRoomId: activeChatId,
      userId: currentUserId,
      userName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", {
        chatRoomId: activeChatId,
        userId: currentUserId,
      });
    }, 2000);
  }, [activeChatId, currentUserId, user]);

  const sanitizeMessage = (text: string): string => {
    return text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[^\S\n]+$/gm, "")
      .trim();
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeChatId || sending) return;

    const text = sanitizeMessage(messageText);
    setMessageText("");
    setSending(true);

    const socket = getSocket();
    socket.emit("stop-typing", {
      chatRoomId: activeChatId,
      userId: currentUserId,
    });

    try {
      const response = await chatService.sendMessage(activeChatId, {
        content: text,
      });
      if (response.success && response.data) {
        addMessage(activeChatId, response.data as any);
        const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
        updateRoomPreview(activeChatId, preview, new Date().toISOString());
      } else {
        toast.error(response.message || "Failed to send message");
        setMessageText(text);
      }
    } catch {
      toast.error("Failed to send message");
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    if (e.key === "Enter" && e.shiftKey) {
      const value = e.currentTarget.value;
      const cursorPos = e.currentTarget.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      const consecutiveNewlines = textBeforeCursor.match(/\n*$/)?.[0]?.length || 0;
      if (consecutiveNewlines >= 2) {
        e.preventDefault();
      }
    }
  };

  if (!chatRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
        <MessageSquareText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Select a chat
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Choose a conversation or start a new one
        </p>
      </div>
    );
  }

  const isInCall =
    (callState === "in-call" || callState === "calling") &&
    callChatRoomId === chatRoom?.id;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      <ChatHeader
        chatRoom={chatRoom}
        onAddMembers={onAddMembers}
        onLeave={onLeave}
        onRename={onRename}
        onDelete={onDelete}
        onStartCall={onStartCall}
      />

      {isInCall && currentUserId && <CallScreen currentUserId={currentUserId} />}

      <ScrollArea className="flex-1 py-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full py-20">
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquareText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currentMessages.map((msg, idx) => {
              const prevMsg = currentMessages[idx - 1];
              const nextMsg = currentMessages[idx + 1];
              const showAvatar =
                !prevMsg ||
                prevMsg.senderId !== msg.senderId ||
                prevMsg.type === "SYSTEM" ||
                msg.type === "SYSTEM";

              const hasTimeGap = !nextMsg ||
                nextMsg.senderId !== msg.senderId ||
                Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) > 2 * 60 * 1000;

              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  isOwnMessage={msg.senderId === currentUserId}
                  showAvatar={showAvatar}
                  showTimestamp={hasTimeGap}
                />
              );
            })}
          </div>
        )}
        {currentTyping.length > 0 && (
          <div className="px-4 py-1">
            <span className="text-xs text-muted-foreground italic">
              {currentTyping.map((u) => u.userName).join(", ")}{" "}
              {currentTyping.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="border-t p-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[40px] max-h-[160px] resize-none py-2"
            rows={1}
            disabled={sending}
          />
          <Button
            size="icon"
            className="flex-shrink-0"
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
