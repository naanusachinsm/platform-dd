import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatMessage } from "@/api/chatTypes";
import { format } from "date-fns";
import { Phone, Video } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export default function ChatMessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
}: ChatMessageBubbleProps) {
  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.sender
            ? `${message.sender.firstName} ${message.sender.lastName} `
            : ""}
          {message.content}
        </span>
      </div>
    );
  }

  if (message.type === "CALL") {
    let callType = "audio";
    let duration = 0;
    try {
      const parsed = JSON.parse(message.content);
      callType = parsed.callType || "audio";
      duration = parsed.duration || 0;
    } catch {
      // content might not be JSON for older messages
    }

    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationText =
      duration > 0
        ? `${mins > 0 ? `${mins}m ` : ""}${secs}s`
        : "No answer";
    const callerName = message.sender
      ? `${message.sender.firstName} ${message.sender.lastName}`
      : "Unknown";
    const CallIcon = callType === "video" ? Video : Phone;

    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5">
          <CallIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">
            {callerName} &middot;{" "}
            {callType === "video" ? "Video" : "Audio"} call &middot;{" "}
            {durationText}
          </span>
        </div>
      </div>
    );
  }

  const initials = message.sender
    ? `${message.sender.firstName?.[0] || ""}${message.sender.lastName?.[0] || ""}`
    : "?";

  const senderName = message.sender
    ? `${message.sender.firstName} ${message.sender.lastName}`
    : "Unknown";

  return (
    <div
      className={`flex gap-2 px-4 py-1 overflow-hidden ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div className="w-7 flex-shrink-0">
        {showAvatar && (
          <Avatar className="h-7 w-7">
            <AvatarImage src={message.sender?.avatarUrl} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div
        className={`flex flex-col max-w-[50%] min-w-0 ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {message.content}
        </div>
        {showTimestamp && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
        )}
      </div>
    </div>
  );
}
