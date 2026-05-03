import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  LogOut,
  Users,
  Pencil,
  Trash2,
  Phone,
  Video,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatRoom } from "@/api/chatTypes";
import { useAppStore } from "@/stores/appStore";

interface ChatHeaderProps {
  chatRoom: ChatRoom;
  onAddMembers: () => void;
  onLeave: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onStartCall?: (callType: "audio" | "video") => void;
}

export default function ChatHeader({
  chatRoom,
  onAddMembers,
  onLeave,
  onRename,
  onDelete,
  onStartCall,
}: ChatHeaderProps) {
  const user = useAppStore((s) => s.user);
  const currentUserId = user?.sub || user?.id;

  const getDisplayName = () => {
    if (chatRoom.type === "GROUP") {
      return chatRoom.name || "Group Chat";
    }
    const otherMember = chatRoom.members?.find(
      (m) => m.userId !== currentUserId
    );
    if (otherMember?.user) {
      return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
    }
    return "Chat";
  };

  const getAvatarInfo = () => {
    if (chatRoom.type === "GROUP") {
      return {
        src: chatRoom.avatarUrl,
        fallback: (chatRoom.name || "G")[0].toUpperCase(),
      };
    }
    const otherMember = chatRoom.members?.find(
      (m) => m.userId !== currentUserId
    );
    if (otherMember?.user) {
      return {
        src: otherMember.user.avatarUrl,
        fallback: `${otherMember.user.firstName?.[0] || ""}${otherMember.user.lastName?.[0] || ""}`,
      };
    }
    return { src: undefined, fallback: "?" };
  };

  const memberCount = chatRoom.members?.length || 0;
  const avatar = getAvatarInfo();

  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-background flex-shrink-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar.src} />
          <AvatarFallback className="text-sm font-medium">
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-sm font-semibold leading-none capitalize">
            {getDisplayName()}
          </h3>
          {chatRoom.type === "GROUP" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} members
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onStartCall?.("audio")}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Audio call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onStartCall?.("video")}
              >
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
        </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {chatRoom.type === "GROUP" && (
            <>
              {onRename && (
                <DropdownMenuItem onClick={onRename}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={onLeave}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Chat
          </DropdownMenuItem>
          {chatRoom.type === "GROUP" && onDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
