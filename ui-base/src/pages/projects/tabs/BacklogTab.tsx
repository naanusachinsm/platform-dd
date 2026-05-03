import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

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
  SprintStatusLabels,
  TicketTypeLabels,
  TicketTypeColors,
  TicketPriorityLabels,
} from "@/api/projectTypes";

import { Link } from "react-router-dom";
import TicketDetailModal from "@/components/projects/TicketDetailModal";
import TicketFilters from "@/components/projects/TicketFilters";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

const SPRINT_STATUS_ORDER: Record<string, number> = { ACTIVE: 0, PLANNING: 1, COMPLETED: 2 };
const SPRINT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  PLANNING: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  COMPLETED: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

function formatDateRange(start?: string, end?: string): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString();
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

function filterIssues(issues: Ticket[], search: string, typeFilter: string, priorityFilter: string, assigneeFilter: string): Ticket[] {
  return issues.filter((t) => {
    if (search) {
      const term = search.toLowerCase();
      if (!t.title.toLowerCase().includes(term) && !t.ticketKey.toLowerCase().includes(term)) return false;
    }
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
    return true;
  });
}

interface BacklogTabProps {
  project: Project;
  members: UserSummary[];
  sprints: Sprint[];
  columns: BoardColumn[];
  onRefresh: () => void;
}

function capitalize(s?: string | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

function getAssigneeName(issue: Ticket): string {
  if (!issue.assignee) return "Unassigned";
  return [capitalize(issue.assignee.firstName), capitalize(issue.assignee.lastName)].filter(Boolean).join(" ") || "Unassigned";
}

export default function BacklogTab({ project, members, sprints: initialSprints, columns, onRefresh }: BacklogTabProps) {
  const { user } = useAppStore();
  const [canUpdateSprint, setCanUpdateSprint] = useState(false);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.SPRINT).then((res) => {
      if (res.success && res.data) setCanUpdateSprint(res.data.actions?.includes(ActionType.UPDATE) ?? false);
    });
  }, [user]);

  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [sprintIssues, setSprintIssues] = useState<Record<string, Ticket[]>>({});
  const [backlogIssues, setBacklogIssues] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  const [moveToSprintId, setMoveToSprintId] = useState<string>("");
  const [movingIssues, setMovingIssues] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [selectedIssue, setSelectedIssue] = useState<Ticket | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [confirmSprint, setConfirmSprint] = useState<{ action: "start" | "complete"; sprint: Sprint } | null>(null);

  const [isSprintCreateOpen, setIsSprintCreateOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState<{
    name: string;
    goal: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ name: "", goal: "", startDate: undefined, endDate: undefined });
  const [sprintSubmitting, setSprintSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [backlogRes, sprintsRes] = await Promise.all([
        projectService.getBacklogData(project.id),
        projectService.getSprints(project.id),
      ]);

      if (backlogRes.success && backlogRes.data) setBacklogIssues(backlogRes.data.backlog);

      const sprintList = sprintsRes.success ? sprintsRes.data?.data ?? [] : [];
      setSprints(sprintList);

      if (sprintList.length > 0) {
        const issueResults = await Promise.all(
          sprintList.map((s) => projectService.getTickets(project.id, { sprintId: s.id, limit: 200 }))
        );
        const issueMap: Record<string, Ticket[]> = {};
        sprintList.forEach((s, i) => {
          issueMap[s.id] = issueResults[i].success ? issueResults[i].data?.data ?? [] : [];
        });
        setSprintIssues(issueMap);
      } else {
        setSprintIssues({});
      }
    } catch {
      toast.error("Failed to load backlog data");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
    onRefresh();
  }, [fetchData, onRefresh]);

  const sortedSprints = useMemo(
    () => [...sprints].sort((a, b) => (SPRINT_STATUS_ORDER[a.status] ?? 9) - (SPRINT_STATUS_ORDER[b.status] ?? 9)),
    [sprints]
  );

  const toggleCollapse = (sprintId: string) =>
    setCollapsedSprints((prev) => ({ ...prev, [sprintId]: !prev[sprintId] }));

  const handleConfirmSprintAction = async () => {
    if (!confirmSprint) return;
    const { action, sprint } = confirmSprint;
    setConfirmSprint(null);

    if (action === "start") {
      try {
        const res = await projectService.startSprint(project.id, sprint.id);
        if (res.success) { toast.success(`Sprint "${sprint.name}" started`); refresh(); }
        else toast.error(res.message || "Failed to start sprint");
      } catch { toast.error("Failed to start sprint"); }
    } else {
      try {
        const res = await projectService.completeSprint(project.id, sprint.id);
        if (res.success) {
          const summary = (res.data as any)?.summary;
          const parts: string[] = [`Sprint "${sprint.name}" completed.`];
          if (summary) {
            if (summary.done > 0) parts.push(`${summary.done} done issue${summary.done !== 1 ? "s" : ""} kept.`);
            if (summary.movedToBacklog > 0) parts.push(`${summary.movedToBacklog} incomplete issue${summary.movedToBacklog !== 1 ? "s" : ""} moved to backlog.`);
          }
          toast.success(parts.join(" "));
          refresh();
        } else {
          toast.error(res.message || "Failed to complete sprint");
        }
      } catch { toast.error("Failed to complete sprint"); }
    }
  };

  const handleCreateSprint = async () => {
    if (!sprintForm.name.trim()) { toast.error("Sprint name is required"); return; }
    setSprintSubmitting(true);
    try {
      const res = await projectService.createSprint(project.id, {
        name: sprintForm.name.trim(),
        goal: sprintForm.goal.trim() || undefined,
        startDate: sprintForm.startDate ? format(sprintForm.startDate, "yyyy-MM-dd") : undefined,
        endDate: sprintForm.endDate ? format(sprintForm.endDate, "yyyy-MM-dd") : undefined,
      });
      if (res.success) {
        toast.success("Sprint created");
        setIsSprintCreateOpen(false);
        setSprintForm({ name: "", goal: "", startDate: undefined, endDate: undefined });
        refresh();
      } else toast.error(res.message || "Failed to create sprint");
    } catch { toast.error("Failed to create sprint"); }
    finally { setSprintSubmitting(false); }
  };

  const PRIORITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    HIGHEST: { icon: ArrowUp, color: "text-red-600" },
    HIGH: { icon: ArrowUp, color: "text-orange-500" },
    MEDIUM: { icon: Minus, color: "text-yellow-500" },
    LOW: { icon: ArrowDown, color: "text-blue-500" },
    LOWEST: { icon: ArrowDown, color: "text-gray-400" },
  };
  const columnMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) next.delete(issueId);
      else next.add(issueId);
      return next;
    });
  };

  const toggleAllBacklog = (issues: Ticket[]) => {
    const allSelected = issues.every((t) => selectedIssueIds.has(t.id));
    if (allSelected) {
      setSelectedIssueIds((prev) => {
        const next = new Set(prev);
        issues.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIssueIds((prev) => {
        const next = new Set(prev);
        issues.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const handleMoveToSprint = async () => {
    if (!moveToSprintId || selectedIssueIds.size === 0) return;
    setMovingIssues(true);
    try {
      await Promise.all(
        Array.from(selectedIssueIds).map((issueId) =>
          projectService.updateTicket(project.id, issueId, { sprintId: moveToSprintId })
        )
      );
      toast.success(`${selectedIssueIds.size} issue${selectedIssueIds.size !== 1 ? "s" : ""} moved to sprint`);
      setSelectedIssueIds(new Set());
      setMoveToSprintId("");
      refresh();
    } catch {
      toast.error("Failed to move issues to sprint");
    } finally {
      setMovingIssues(false);
    }
  };

  const renderIssueTable = (issues: Ticket[], showCheckbox: boolean) => {
    if (issues.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-6">No issues found</p>;
    }
    return (
      <Table>
        <TableBody>
          {issues.map((issue) => {
            const priorityInfo = PRIORITY_ICONS[issue.priority];
            const PriorityIcon = priorityInfo?.icon ?? Minus;
            const col = columnMap.get(issue.columnId);
            return (
              <TableRow key={issue.id} className="cursor-pointer hover:bg-muted/40">
                {showCheckbox && (
                  <TableCell className="w-10 px-3">
                    <Checkbox
                      checked={selectedIssueIds.has(issue.id)}
                      onCheckedChange={() => toggleIssueSelection(issue.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                <TableCell className="w-[100px] px-3 font-mono text-xs text-muted-foreground">
                  <Link
                    to={`/dashboard/projects/${project.key}/tickets/${issue.ticketNumber}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary hover:underline"
                  >{issue.ticketKey}</Link>
                </TableCell>
                <TableCell className="px-3" onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}>
                  <span className="text-sm capitalize truncate block max-w-[300px]">{issue.title}</span>
                </TableCell>
                <TableCell className="w-[100px] px-3" onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}>
                  <Badge variant="secondary" className={cn("text-[10px]", TicketTypeColors[issue.type])}>
                    {TicketTypeLabels[issue.type]}
                  </Badge>
                </TableCell>
                <TableCell className="w-[130px] px-3 text-sm capitalize" onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}>
                  {getAssigneeName(issue)}
                </TableCell>
                <TableCell className="w-[80px] px-3" onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}>
                  {col && <Badge variant="outline" className="text-[10px]">{col.name}</Badge>}
                </TableCell>
                <TableCell className="w-[100px] px-3" onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}>
                  <div className="flex items-center gap-1">
                    <PriorityIcon className={cn("size-3.5", priorityInfo?.color ?? "text-gray-400")} />
                    <span className="text-xs">{TicketPriorityLabels[issue.priority]}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const planningOrActiveSprints = useMemo(
    () => sprints.filter((s) => s.status === SprintStatus.PLANNING || s.status === SprintStatus.ACTIVE),
    [sprints]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 py-3 border-b bg-background">
        <div className="flex items-center justify-between gap-3">
          <TicketFilters
            search={search} onSearchChange={setSearch}
            typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
            assigneeFilter={assigneeFilter} onAssigneeFilterChange={setAssigneeFilter}
            members={members}
          />
          {selectedIssueIds.size > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{selectedIssueIds.size} selected</span>
              <Select value={moveToSprintId} onValueChange={setMoveToSprintId}>
                <SelectTrigger size="sm" className="h-8 w-[180px] text-sm">
                  <SelectValue placeholder="Select Sprint" />
                </SelectTrigger>
                <SelectContent>
                  {planningOrActiveSprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 cursor-pointer" disabled={!moveToSprintId || movingIssues} onClick={handleMoveToSprint}>
                {movingIssues ? "Moving..." : "Add to Sprint"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {sortedSprints.map((sprint) => {
          const issues = sprintIssues[sprint.id] ?? [];
          const filtered = filterIssues(issues, search, typeFilter, priorityFilter, assigneeFilter);
          const isOpen = collapsedSprints[sprint.id] === true;
          const dateRange = formatDateRange(sprint.startDate, sprint.endDate);

          return (
            <Collapsible key={sprint.id} open={isOpen} onOpenChange={() => toggleCollapse(sprint.id)}>
              <div className="border rounded-md">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0">
                      {isOpen ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                      <span className="font-semibold text-sm">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground">({filtered.length} issue{filtered.length !== 1 ? "s" : ""})</span>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2 shrink-0">
                    {dateRange && <span className="text-xs text-muted-foreground">{dateRange}</span>}
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", SPRINT_STATUS_COLORS[sprint.status] ?? "")}>
                      {SprintStatusLabels[sprint.status]}
                    </Badge>
                    {sprint.endDate && sprint.status !== SprintStatus.COMPLETED && isPast(parseISO(sprint.endDate)) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Overdue
                      </Badge>
                    )}
                    {canUpdateSprint && sprint.status === SprintStatus.PLANNING && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmSprint({ action: "start", sprint }); }} className="h-7 text-xs cursor-pointer gap-1">
                        <Play className="size-3" /> Start Sprint
                      </Button>
                    )}
                    {canUpdateSprint && sprint.status === SprintStatus.ACTIVE && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmSprint({ action: "complete", sprint }); }} className="h-7 text-xs cursor-pointer gap-1">
                        <CheckCircle className="size-3" /> Complete Sprint
                      </Button>
                    )}
                  </div>
                </div>
                <CollapsibleContent>
                  {renderIssueTable(filtered, false)}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {(() => {
          const filtered = filterIssues(backlogIssues, search, typeFilter, priorityFilter, assigneeFilter);
          const isBacklogOpen = collapsedSprints["__backlog__"] === true;
          const allSelected = filtered.length > 0 && filtered.every((t) => selectedIssueIds.has(t.id));
          return (
            <Collapsible open={isBacklogOpen} onOpenChange={() => toggleCollapse("__backlog__")}>
              <div className="border rounded-md">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0">
                      {isBacklogOpen ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                      <span className="font-semibold text-sm">Backlog</span>
                      <span className="text-xs text-muted-foreground">({filtered.length} issue{filtered.length !== 1 ? "s" : ""})</span>
                    </button>
                  </CollapsibleTrigger>
                  {filtered.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleAllBacklog(filtered)}
                      />
                      <span className="text-xs text-muted-foreground">Select all</span>
                    </div>
                  )}
                </div>
                <CollapsibleContent>
                  {renderIssueTable(filtered, true)}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })()}
      </div>

      <TicketDetailModal
        open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}
        projectId={project.id} ticket={selectedIssue}
        columns={columns} sprints={sprints} members={members}
        onSaved={refresh}
      />

      <Dialog open={isSprintCreateOpen} onOpenChange={setIsSprintCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Sprint</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sprint-name">Name *</Label>
              <Input id="sprint-name" placeholder="e.g. Sprint 1" value={sprintForm.name} onChange={(e) => setSprintForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sprint-goal">Goal</Label>
              <Textarea id="sprint-goal" placeholder="What should the team accomplish?" value={sprintForm.goal} rows={3} onChange={(e) => setSprintForm((p) => ({ ...p, goal: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !sprintForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sprintForm.startDate ? format(sprintForm.startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={sprintForm.startDate}
                      onSelect={(d) => setSprintForm((p) => ({ ...p, startDate: d }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !sprintForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sprintForm.endDate ? format(sprintForm.endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={sprintForm.endDate}
                      onSelect={(d) => setSprintForm((p) => ({ ...p, endDate: d }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSprintCreateOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateSprint} disabled={sprintSubmitting || !sprintForm.name.trim()} className="cursor-pointer">
              {sprintSubmitting ? "Creating..." : "Create Sprint"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmSprint} onOpenChange={(open) => { if (!open) setConfirmSprint(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmSprint?.action === "start" ? "Start Sprint" : "Complete Sprint"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {(() => {
                  if (!confirmSprint) return null;
                  const { action, sprint } = confirmSprint;
                  const issues = sprintIssues[sprint.id] ?? [];
                  const total = issues.length;
                  const sortedCols = [...columns].sort((a, b) => a.position - b.position);
                  const doneColumnId = sortedCols[sortedCols.length - 1]?.id;
                  const doneCount = issues.filter((t) => (t.resolution && t.resolution !== "UNRESOLVED") || t.columnId === doneColumnId).length;
                  const incompleteCount = total - doneCount;
                  const dateRange = formatDateRange(sprint.startDate, sprint.endDate);

                  if (action === "start") {
                    return (
                      <>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{sprint.name}</span> will become the active sprint for this project.
                        </p>
                        {dateRange && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="size-3.5 text-muted-foreground" />
                            <span>{dateRange}</span>
                          </div>
                        )}
                        <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
                          <span className="font-medium text-foreground">{total}</span> issue{total !== 1 ? "s" : ""} will be included in this sprint
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      <p className="text-sm text-muted-foreground">
                        You are about to complete <span className="font-medium text-foreground">{sprint.name}</span>.
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
            <AlertDialogAction onClick={handleConfirmSprintAction} className="cursor-pointer">
              {confirmSprint?.action === "start" ? "Start Sprint" : "Complete Sprint"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
