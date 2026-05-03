import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from "lucide-react";
import { isPast, parseISO } from "date-fns";

import { projectService } from "@/api/projectService";
import type {
  Project,
  Ticket,
  BoardColumn,
  Sprint,
  UserSummary,
} from "@/api/projectTypes";
import {
  TicketTypeLabels,
  TicketTypeColors,
  TicketPriorityLabels,
} from "@/api/projectTypes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TicketDetailModal from "@/components/projects/TicketDetailModal";
import TicketFilters from "@/components/projects/TicketFilters";
import { NoDataState } from "@/components/common/NoDataState";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/dateFormat";

const PRIORITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  HIGHEST: { icon: ArrowUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-orange-500" },
  MEDIUM: { icon: Minus, color: "text-yellow-500" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ArrowDown, color: "text-gray-400" },
};

interface ListTabProps {
  project: Project;
  members: UserSummary[];
  sprints: Sprint[];
  columns: BoardColumn[];
  onRefresh: () => void;
}

export default function ListTab({ project, members, sprints, columns, onRefresh }: ListTabProps) {
  const [issues, setIssues] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Ticket | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getTickets(project.id, { limit: 500 });
      if (res.success && res.data) setIssues(res.data.data ?? []);
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const refresh = useCallback(async () => {
    await loadIssues();
    onRefresh();
  }, [loadIssues, onRefresh]);

  const handleIssueClick = useCallback((issue: Ticket) => {
    setSelectedIssue(issue);
    setModalOpen(true);
  }, []);

  const columnMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const capitalize = (s?: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (search) {
        const q = search.toLowerCase();
        if (!issue.title.toLowerCase().includes(q) && !issue.ticketKey.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all" && issue.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [issues, search, typeFilter, priorityFilter, assigneeFilter]);

  const total = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const paginatedIssues = filteredIssues.slice(startIdx, startIdx + pageSize);
  const startRow = total === 0 ? 0 : startIdx + 1;
  const endRow = Math.min(startIdx + pageSize, total);

  useEffect(() => { setPage(1); }, [pageSize, search, typeFilter, priorityFilter, assigneeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4 h-full overflow-y-auto">
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

      {filteredIssues.length === 0 ? (
        <NoDataState
          title={search || typeFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
            ? "No Issues Found"
            : "No Issues Available"}
          description={search || typeFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
            ? "No issues match your current filters. Try adjusting your search or filters."
            : "There are no issues in this project yet. Use the Create button to add your first issue."}
          showAction={false}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Key</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[90px]">Type</TableHead>
                  <TableHead className="w-[130px]">Assignee</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Priority</TableHead>
                  <TableHead className="w-[130px]">Sprint</TableHead>
                  <TableHead className="w-[150px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIssues.map((issue) => {
                  const info = PRIORITY_ICONS[issue.priority];
                  const PriorityIcon = info?.icon ?? Minus;
                  const statusName = columnMap.get(issue.columnId)?.name ?? "—";
                  const assigneeName = issue.assignee
                    ? `${capitalize(issue.assignee.firstName)} ${capitalize(issue.assignee.lastName)}`
                    : "Unassigned";

                  return (
                    <TableRow key={issue.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleIssueClick(issue)}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {issue.dueDate && isPast(parseISO(issue.dueDate)) && issue.resolution === "UNRESOLVED" && (
                            <AlertCircle className="size-3 text-destructive shrink-0" />
                          )}
                          <Link
                            to={`/dashboard/projects/${project.key}/tickets/${issue.ticketNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-sm text-muted-foreground hover:text-primary hover:underline"
                          >{issue.ticketKey}</Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize truncate block max-w-[300px]">{issue.title}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs", TicketTypeColors[issue.type])}>
                          {TicketTypeLabels[issue.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{assigneeName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{statusName}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon className={cn("size-4", info?.color ?? "text-gray-400")} />
                          <span className="text-sm">{TicketPriorityLabels[issue.priority]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{issue.sprint?.name ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{formatDateTime(issue.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {startRow} to {endRow} of {total} issues</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[65px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(1)} disabled={page <= 1}>
                  <ChevronsLeft className="size-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="size-7" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="size-7" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="size-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                  <ChevronsRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

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
    </div>
  );
}
