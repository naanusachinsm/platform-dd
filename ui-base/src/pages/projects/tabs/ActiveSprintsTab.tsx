import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { ChevronDown, ChevronRight, CheckCircle, ArrowUp, ArrowDown, Minus, GripVertical, Zap, GitBranchPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { projectService } from "@/api/projectService";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import type {
  Project,
  Ticket,
  Sprint,
  BoardColumn,
  UserSummary,
} from "@/api/projectTypes";
import {
  SprintStatus,
  TicketTypeColors,
  TicketPriorityLabels,
} from "@/api/projectTypes";

import TicketDetailModal from "@/components/projects/TicketDetailModal";
import TicketFilters from "@/components/projects/TicketFilters";
import { NoDataState } from "@/components/common/NoDataState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isPast, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-green-600 text-white",
  "bg-orange-500 text-white",
  "bg-purple-600 text-white",
  "bg-rose-600 text-white",
  "bg-cyan-600 text-white",
  "bg-amber-600 text-white",
  "bg-indigo-600 text-white",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(user?: UserSummary | null): string {
  if (!user) return "?";
  return (
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?"
  );
}

interface ActiveSprintsTabProps {
  project: Project;
  members: UserSummary[];
  sprints: Sprint[];
  columns: BoardColumn[];
  onRefresh: () => void;
}

export default function ActiveSprintsTab({
  project,
  members,
  sprints,
  columns,
  onRefresh,
}: ActiveSprintsTabProps) {
  const { user } = useAppStore();
  const [canUpdateSprint, setCanUpdateSprint] = useState(false);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.SPRINT).then((res) => {
      if (res.success && res.data) setCanUpdateSprint(res.data.actions?.includes(ActionType.UPDATE) ?? false);
    });
  }, [user]);

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === SprintStatus.ACTIVE),
    [sprints]
  );

  const [issues, setIssues] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedUsers, setCollapsedUsers] = useState<Record<string, boolean>>(
    {}
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [selectedIssue, setSelectedIssue] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const fetchIssues = useCallback(async () => {
    if (!activeSprint) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await projectService.getTickets(project.id, {
        sprintId: activeSprint.id,
        limit: 500,
      });
      if (res.success && res.data) setIssues(res.data.data ?? []);
    } catch {
      toast.error("Failed to load sprint issues");
    } finally {
      setLoading(false);
    }
  }, [project.id, activeSprint]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const refresh = useCallback(async () => {
    await fetchIssues();
    onRefresh();
  }, [fetchIssues, onRefresh]);

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    try {
      const res = await projectService.completeSprint(
        project.id,
        activeSprint.id
      );
      if (res.success) {
        const summary = res.data?.summary;
        const parts: string[] = [`Sprint "${activeSprint.name}" completed.`];
        if (summary) {
          if (summary.done > 0) parts.push(`${summary.done} done issue${summary.done !== 1 ? "s" : ""} kept.`);
          if (summary.movedToBacklog > 0) parts.push(`${summary.movedToBacklog} incomplete issue${summary.movedToBacklog !== 1 ? "s" : ""} moved to backlog.`);
        }
        toast.success(parts.join(" "));
        onRefresh();
      } else {
        toast.error(res.message || "Failed to complete sprint");
      }
    } catch {
      toast.error("Failed to complete sprint");
    }
  };

  const matchesFilters = useCallback(
    (issue: Ticket) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !issue.title.toLowerCase().includes(q) &&
          !issue.ticketKey.toLowerCase().includes(q)
        )
          return false;
      }
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (priorityFilter !== "all" && issue.priority !== priorityFilter)
        return false;
      if (assigneeFilter !== "all" && issue.assigneeId !== assigneeFilter)
        return false;
      return true;
    },
    [search, typeFilter, priorityFilter, assigneeFilter]
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const groupedByAssignee = useMemo(() => {
    const filtered = issues.filter(matchesFilters);
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const groups: {
      key: string;
      user: UserSummary | null;
      issues: Ticket[];
    }[] = [];
    const groupMap = new Map<string, number>();

    for (const issue of filtered) {
      const key = issue.assigneeId || "__unassigned__";
      const idx = groupMap.get(key);
      if (idx !== undefined) {
        groups[idx].issues.push(issue);
      } else {
        groupMap.set(key, groups.length);
        groups.push({
          key,
          user:
            issue.assignee ||
            memberMap.get(issue.assigneeId ?? "") ||
            null,
          issues: [issue],
        });
      }
    }

    groups.sort((a, b) => {
      if (!a.user && !b.user) return 0;
      if (!a.user) return 1;
      if (!b.user) return -1;
      const nameA = `${a.user.firstName} ${a.user.lastName}`
        .trim()
        .toLowerCase();
      const nameB = `${b.user.firstName} ${b.user.lastName}`
        .trim()
        .toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return groups;
  }, [issues, matchesFilters, members]);

  const toggleCollapse = (key: string) =>
    setCollapsedUsers((prev) => ({ ...prev, [key]: !prev[key] }));

  const PRIORITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    HIGHEST: { icon: ArrowUp, color: "text-red-600" },
    HIGH: { icon: ArrowUp, color: "text-orange-500" },
    MEDIUM: { icon: Minus, color: "text-yellow-500" },
    LOW: { icon: ArrowDown, color: "text-blue-500" },
    LOWEST: { icon: ArrowDown, color: "text-gray-400" },
  };

  const handleIssueClick = useCallback((issue: Ticket) => {
    setSelectedIssue(issue);
    setModalOpen(true);
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      const { draggableId, destination, source } = result;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      setIssues((prev) =>
        prev.map((t) => (t.id === draggableId ? { ...t, columnId: destination.droppableId } : t))
      );

      try {
        await projectService.moveTicket(project.id, draggableId, {
          columnId: destination.droppableId,
          position: destination.index,
        });
      } catch {
        toast.error("Failed to move issue");
        setIssues((prev) =>
          prev.map((t) => (t.id === draggableId ? { ...t, columnId: source.droppableId } : t))
        );
      }
    },
    [project.id]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="p-4">
        <NoDataState
          title="No Active Sprint"
          description="Start a sprint from the Backlog tab to see it here."
          showAction={false}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 py-3 border-b bg-background flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TicketFilters
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeFilterChange={setAssigneeFilter}
            members={members}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs font-medium">
            {activeSprint.name}
          </Badge>
          {activeSprint.endDate && isPast(parseISO(activeSprint.endDate)) && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Overdue
            </Badge>
          )}
          {canUpdateSprint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleteConfirm(true)}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <CheckCircle className="size-3.5" />
              Complete Sprint
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {groupedByAssignee.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No issues match the current filters.
          </div>
        ) : (
          groupedByAssignee.map((group) => {
            const isOpen = collapsedUsers[group.key] === true;
            const userName = group.user
              ? `${group.user.firstName ?? ""} ${group.user.lastName ?? ""}`.trim()
              : "Unassigned";
            const colorIdx = hashString(group.key) % AVATAR_COLORS.length;

            return (
              <Collapsible
                key={group.key}
                open={isOpen}
                onOpenChange={() => toggleCollapse(group.key)}
              >
                <div className="border rounded-md">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left">
                      {isOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <Avatar className="size-7 shrink-0">
                        {group.user?.avatarUrl && (
                          <AvatarImage src={group.user.avatarUrl} alt="" />
                        )}
                        <AvatarFallback
                          className={`text-[11px] font-medium ${AVATAR_COLORS[colorIdx]}`}
                        >
                          {getInitials(group.user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm capitalize">
                        {userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({group.issues.length} work item
                        {group.issues.length !== 1 ? "s" : ""})
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="flex gap-3 p-3">
                        {sortedColumns.map((col) => {
                          const colIssues = group.issues.filter(
                            (t) => t.columnId === col.id
                          );
                          return (
                            <div key={col.id} className="flex-1 min-w-0 rounded-lg bg-muted/40 p-2">
                              <div className="flex items-center gap-1.5 mb-2 px-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {col.name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {colIssues.length}
                                </Badge>
                              </div>
                              <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "space-y-1.5 min-h-[48px] rounded-md p-1",
                                      snapshot.isDraggingOver && "bg-primary/5"
                                    )}
                                  >
                                    {colIssues.map((issue, index) => {
                                      const priorityInfo = PRIORITY_ICONS[issue.priority];
                                      const PriorityIcon = priorityInfo?.icon ?? Minus;
                                      return (
                                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                          {(dragProvided, dragSnapshot) => (
                                            <div
                                              ref={dragProvided.innerRef}
                                              {...dragProvided.draggableProps}
                                              className={cn(
                                                "flex rounded-md border bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all",
                                                dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                                              )}
                                            >
                                              <div
                                                {...dragProvided.dragHandleProps}
                                                className="flex items-center px-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                              >
                                                <GripVertical className="size-3.5" />
                                              </div>
                                              <div
                                                className="flex-1 min-w-0 px-2 py-2 cursor-pointer"
                                                onClick={() => handleIssueClick(issue)}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <p className="text-sm font-medium leading-snug capitalize truncate">{issue.title}</p>
                                                  <Avatar className="size-5 shrink-0">
                                                    {issue.assignee?.avatarUrl && <AvatarImage src={issue.assignee.avatarUrl} alt="" />}
                                                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                      {issue.assignee ? `${issue.assignee.firstName?.charAt(0) ?? ""}${issue.assignee.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?" : "?"}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                </div>
                                                <div className="flex items-center justify-between mt-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    {issue.parent && (
                                                      <>
                                                        <GitBranchPlus className="size-3 text-muted-foreground" />
                                                        <span className="text-[11px] text-muted-foreground font-mono">{issue.parent.ticketKey}</span>
                                                      </>
                                                    )}
                                                    <Link
                                                      to={`/dashboard/projects/${project.key}/tickets/${issue.ticketNumber}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-[11px] font-mono text-muted-foreground hover:text-primary hover:underline"
                                                    >{issue.ticketKey}</Link>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    {issue.dueDate && isPast(parseISO(issue.dueDate)) && issue.resolution === "UNRESOLVED" && (
                                                      <AlertCircle className="size-3 text-destructive" />
                                                    )}
                                                    <PriorityIcon className={cn("size-3.5", priorityInfo?.color ?? "text-gray-400")} />
                                                    <span className="text-[10px] text-muted-foreground">{TicketPriorityLabels[issue.priority]}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        })}
                      </div>
                    </DragDropContext>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      <TicketDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={project.id}
        ticket={selectedIssue}
        columns={columns}
        sprints={sprints}
        members={members}
        onSaved={refresh}
      />

      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Sprint</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {(() => {
                  const total = issues.length;
                  const sortedCols = [...columns].sort((a, b) => a.position - b.position);
                  const doneColumnId = sortedCols[sortedCols.length - 1]?.id;
                  const doneCount = issues.filter((t) => (t.resolution && t.resolution !== "UNRESOLVED") || t.columnId === doneColumnId).length;
                  const incompleteCount = total - doneCount;
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">
                        You are about to complete <span className="font-medium text-foreground">{activeSprint?.name}</span>.
                      </p>
                      <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total issues</span>
                          <span className="font-medium text-foreground">{total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Done — will be kept in sprint</span>
                          <span className="font-medium text-green-600">{doneCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Incomplete — will move to backlog</span>
                          <span className="font-medium text-orange-500">{incompleteCount}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteSprint} className="cursor-pointer">
              Complete Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
