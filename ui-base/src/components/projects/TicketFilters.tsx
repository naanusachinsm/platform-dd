import {
  TicketPriority,
  TicketPriorityLabels,
  TicketType,
  TicketTypeLabels,
} from "@/api/projectTypes";
import type { UserSummary } from "@/api/projectTypes";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface TicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  members: UserSummary[];
}

const TICKET_TYPES = Object.values(TicketType);
const TICKET_PRIORITIES = Object.values(TicketPriority);

function capitalize(s?: string | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

function getMemberDisplayName(member: UserSummary): string {
  const parts = [capitalize(member.firstName), capitalize(member.lastName)].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : member.email ?? member.id;
}

export default function TicketFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  members,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="relative flex-1 min-w-0 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger size="sm" className="h-8 w-[130px] text-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {TICKET_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {TicketTypeLabels[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger size="sm" className="h-8 w-[140px] text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {TICKET_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {TicketPriorityLabels[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
        <SelectTrigger size="sm" className="h-8 w-[130px] text-sm">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {getMemberDisplayName(member)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
