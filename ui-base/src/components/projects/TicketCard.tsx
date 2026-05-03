import { Bug, BookOpen, Zap, CheckSquare, ArrowUp, ArrowDown, Minus, GitBranchPlus } from "lucide-react";
import {
  type Ticket,
  type TicketType,
  type TicketPriority,
  TicketTypeColors,
} from "@/api/projectTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<TicketType, React.ComponentType<{ className?: string }>> = {
  BUG: Bug,
  STORY: BookOpen,
  EPIC: Zap,
  TASK: CheckSquare,
};

const PRIORITY_ICONS: Record<TicketPriority, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  HIGHEST: { icon: ArrowUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-orange-500" },
  MEDIUM: { icon: Minus, color: "text-yellow-500" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ArrowDown, color: "text-gray-400" },
};

interface TicketCardProps {
  issue: Ticket;
  onClick?: (issue: Ticket) => void;
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return (first + last).toUpperCase() || "?";
}

export default function TicketCard({ issue, onClick }: TicketCardProps) {
  const TypeIcon = TYPE_ICONS[issue.type];
  const priorityInfo = PRIORITY_ICONS[issue.priority];
  const PriorityIcon = priorityInfo.icon;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(issue) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(issue);
              }
            }
          : undefined
      }
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm transition-all",
        "hover:shadow-md hover:border-border/80",
        onClick && "cursor-pointer"
      )}
    >
      <p className="text-sm font-medium leading-snug mb-2 line-clamp-2 capitalize">
        {issue.title}
      </p>

      {issue.reporter && (
        <p className="text-xs text-muted-foreground mb-2">
          {issue.reporter.firstName} {issue.reporter.lastName}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeIcon className={cn("size-4", TicketTypeColors[issue.type])} />
          <PriorityIcon className={cn("size-4", priorityInfo.color)} />
          {issue.parent && (
            <>
              <GitBranchPlus className="size-3 text-muted-foreground ml-0.5" />
              <span className="text-xs text-muted-foreground font-mono">
                {issue.parent.ticketKey}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground font-mono ml-0.5">
            {issue.ticketKey}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {issue.storyPoints != null && (
            <span className="flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              {issue.storyPoints}
            </span>
          )}
          {issue.assignee ? (
            <Avatar className="size-6">
              {issue.assignee.avatarUrl && (
                <AvatarImage src={issue.assignee.avatarUrl} alt="" />
              )}
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                ?
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
