import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { projectService } from "@/api/projectService";
import type { Project, ProjectActivity } from "@/api/projectTypes";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NoDataState } from "@/components/common/NoDataState";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/dateFormat";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const ENTITY_COLORS: Record<string, string> = {
  TICKET: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  SPRINT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  BOARD: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  MEMBER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  ASSET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

interface ActivityTabProps {
  project: Project;
}

export default function ActivityTab({ project }: ActivityTabProps) {
  const [activity, setActivity] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadActivity = useCallback(async (p: number, size: number) => {
    try {
      setLoading(true);
      const res = await projectService.getProjectActivity(project.id, { page: p, limit: size });
      if (res.success && res.data) {
        setActivity(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      }
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { loadActivity(page, pageSize); }, [loadActivity, page, pageSize]);

  const capitalize = (s?: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const entityDisplayName = (entityType: string) =>
    entityType === "TICKET" ? "Issue" : entityType;
  const totalPages = Math.ceil(total / pageSize);
  const startRow = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRow = Math.min(page * pageSize, total);

  if (loading && activity.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!loading && activity.length === 0) {
    return (
      <div className="p-4">
        <NoDataState
          title="No Activity Yet"
          description="Project actions like creating issues, moving tasks, and sprint changes will appear here."
          showAction={false}
        />
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4 h-full overflow-y-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Action</TableHead>
              <TableHead className="w-[80px]">Entity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[160px]">Performed By</TableHead>
              <TableHead className="w-[150px]">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((entry) => {
              const userName = entry.performedByUser
                ? `${capitalize(entry.performedByUser.firstName)} ${capitalize(entry.performedByUser.lastName)}`.trim()
                : "System";
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant="secondary" className={cn("text-[10px]", ACTION_COLORS[entry.action] ?? "")}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", ENTITY_COLORS[entry.entityType] ?? "")}>
                      {entityDisplayName(entry.entityType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entry.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        {entry.performedByUser?.avatarUrl && <AvatarImage src={entry.performedByUser.avatarUrl} alt="" />}
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {entry.performedByUser ? `${entry.performedByUser.firstName?.charAt(0) ?? ""}${entry.performedByUser.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?" : "S"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm capitalize">{userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {total > 0 && <span>Showing {startRow} to {endRow} of {total} entries</span>}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-[70px] cursor-pointer">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 25, 30, 50, 100].map((opt) => (
                  <SelectItem key={opt} value={`${opt}`} className="cursor-pointer">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" onClick={() => setPage(1)} disabled={page <= 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
