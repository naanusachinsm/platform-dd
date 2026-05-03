import { useState, useCallback, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus, Kanban, LayoutList, ChevronDown, Trash2, Pencil, GripVertical, ArrowUp, ArrowDown, Minus, GitBranchPlus, AlertCircle } from "lucide-react";
import { isPast, parseISO } from "date-fns";
import { toast } from "sonner";

import { projectService } from "@/api/projectService";
import type {
  Project,
  Ticket,
  Board,
  BoardColumn,
  Sprint,
  BoardData,
  UserSummary,
  CreateBoardRequest,
} from "@/api/projectTypes";
import {
  TicketType,
  TicketPriority,
  TicketTypeLabels,
  TicketPriorityLabels,
} from "@/api/projectTypes";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TicketDetailModal from "@/components/projects/TicketDetailModal";
import TicketFilters from "@/components/projects/TicketFilters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/common";

const PRIORITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  HIGHEST: { icon: ArrowUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-orange-500" },
  MEDIUM: { icon: Minus, color: "text-yellow-500" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ArrowDown, color: "text-gray-400" },
};

interface BoardTabProps {
  project: Project;
  members: UserSummary[];
  sprints: Sprint[];
  onRefresh: () => void;
}

export default function BoardTab({ project, members, sprints, onRefresh }: BoardTabProps) {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardFormData, setBoardFormData] = useState<CreateBoardRequest>({ name: "" });
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const [deleteBoardTarget, setDeleteBoardTarget] = useState<Board | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Ticket | null>(null);

  const loadBoardData = useCallback(async (board: Board | null) => {
    try {
      const res = board
        ? await projectService.getBoardDataById(project.id, board.id)
        : await projectService.getBoardData(project.id);
      if (res.success && res.data) setBoardData(res.data);
    } catch {
      toast.error("Failed to load board data");
    }
  }, [project.id]);

  const loadBoards = useCallback(async () => {
    const res = await projectService.getBoards(project.id);
    if (res.success && res.data) {
      const boardList = res.data.data ?? [];
      setBoards(boardList);
      return selectedBoard;
    }
    return null;
  }, [project.id, selectedBoard]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    const board = await loadBoards();
    await loadBoardData(board ?? null);
    setLoading(false);
  }, [loadBoards, loadBoardData]);

  useState(() => { initialLoad(); });

  const refresh = useCallback(async () => {
    await loadBoardData(selectedBoard);
    onRefresh();
  }, [selectedBoard, loadBoardData, onRefresh]);

  const handleBoardSwitch = useCallback(async (board: Board) => {
    setSelectedBoard(board);
    await loadBoardData(board);
  }, [loadBoardData]);

  const openCreateBoardDialog = () => {
    setEditingBoard(null);
    setBoardFormData({ name: "" });
    setBoardDialogOpen(true);
  };

  const openEditBoardDialog = (board: Board) => {
    setEditingBoard(board);
    setBoardFormData({
      name: board.name,
      filterSprintId: board.filterSprintId,
      filterType: board.filterType,
      filterPriority: board.filterPriority,
      filterAssigneeId: board.filterAssigneeId,
      filterLabels: board.filterLabels,
    });
    setBoardDialogOpen(true);
  };

  const handleSaveBoard = async () => {
    if (!boardFormData.name) return;
    setBoardSubmitting(true);
    try {
      if (editingBoard) {
        const res = await projectService.updateBoard(project.id, editingBoard.id, boardFormData);
        if (res.success && res.data) {
          toast.success("Board updated");
          setBoardDialogOpen(false);
          await loadBoards();
          setSelectedBoard(res.data);
          await loadBoardData(res.data);
        } else {
          toast.error(res.message || "Failed to update board");
        }
      } else {
        const res = await projectService.createBoard(project.id, boardFormData);
        if (res.success && res.data) {
          toast.success("Board created");
          setBoardDialogOpen(false);
          await loadBoards();
          setSelectedBoard(res.data);
          await loadBoardData(res.data);
        } else {
          toast.error(res.message || "Failed to create board");
        }
      }
    } catch {
      toast.error(editingBoard ? "Failed to update board" : "Failed to create board");
    } finally {
      setBoardSubmitting(false);
    }
  };

  const handleDeleteBoard = (board: Board) => {
    setDeleteBoardTarget(board);
  };

  const confirmDeleteBoard = async () => {
    if (!deleteBoardTarget) return;
    try {
      const res = await projectService.deleteBoard(project.id, deleteBoardTarget.id);
      if (res.success) {
        toast.success("Board deleted");
        const updatedBoards = boards.filter((b) => b.id !== deleteBoardTarget.id);
        setBoards(updatedBoards);
        if (selectedBoard?.id === deleteBoardTarget.id) {
          setSelectedBoard(null);
          await loadBoardData(null);
        }
      }
    } catch {
      toast.error("Failed to delete board");
    } finally {
      setDeleteBoardTarget(null);
    }
  };

  const matchesFilters = useCallback(
    (issue: Ticket) => {
      if (search) {
        const q = search.toLowerCase();
        if (!issue.title.toLowerCase().includes(q) && !issue.ticketKey.toLowerCase().includes(q))
          return false;
      }
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all" && issue.assigneeId !== assigneeFilter) return false;
      return true;
    },
    [search, typeFilter, priorityFilter, assigneeFilter]
  );

  const filteredColumns = useMemo(() => {
    if (!boardData) return [];
    return boardData.columns.map((col) => ({
      ...col,
      tickets: col.tickets.filter(matchesFilters),
    }));
  }, [boardData, matchesFilters]);

  const columns = useMemo(() => boardData?.columns ?? [], [boardData]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      const { draggableId, destination, source } = result;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      setBoardData((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, columns: prev.columns.map((col) => ({ ...col, tickets: [...col.tickets] })) };
        const srcCol = updated.columns.find((c) => c.id === source.droppableId);
        const dstCol = updated.columns.find((c) => c.id === destination.droppableId);
        if (!srcCol || !dstCol) return prev;
        const [moved] = srcCol.tickets.splice(source.index, 1);
        if (!moved) return prev;
        moved.columnId = destination.droppableId;
        dstCol.tickets.splice(destination.index, 0, moved);
        return updated;
      });

      try {
        await projectService.moveTicket(project.id, draggableId, {
          columnId: destination.droppableId,
          position: destination.index,
        });
      } catch {
        toast.error("Failed to move issue");
        await refresh();
      }
    },
    [project.id, refresh]
  );

  const handleIssueClick = useCallback((issue: Ticket) => {
    setSelectedIssue(issue);
    setModalOpen(true);
  }, []);

  if (loading || !boardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-6 py-3 flex items-center justify-between gap-3 border-b bg-background">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-[200px] justify-start gap-1.5 cursor-pointer">
                <Kanban className="size-3.5 shrink-0" />
                <span className="truncate capitalize">{selectedBoard?.name || "All Issues"}</span>
                <ChevronDown className="size-3 shrink-0 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <DropdownMenuItem
                className={cn("cursor-pointer", !selectedBoard && "bg-accent")}
                onClick={() => { setSelectedBoard(null); loadBoardData(null); }}
              >
                All Issues
              </DropdownMenuItem>
              {boards.length > 0 && <DropdownMenuSeparator />}
              {boards.map((board) => (
                <DropdownMenuItem
                  key={board.id}
                  className={cn("cursor-pointer justify-between", selectedBoard?.id === board.id && "bg-accent")}
                  onClick={() => handleBoardSwitch(board)}
                >
                  <span className="truncate capitalize">{board.name}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); openEditBoardDialog(board); }}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board); }}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 h-full px-6 py-4">
            {filteredColumns.map((col) => (
              <div key={col.id} className="flex flex-col flex-1 min-w-[200px] rounded-md bg-muted/40">
                <div className="flex items-center justify-between px-2 py-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {col.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{col.tickets.length}</span>
                  </div>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto px-1.5 pb-2 space-y-1.5 min-h-[60px]",
                        snapshot.isDraggingOver && "bg-primary/5 rounded-b-md"
                      )}
                    >
                      {col.tickets.map((issue, index) => {
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
            ))}
          </div>
        </DragDropContext>
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

      {/* Create / Edit Board Dialog */}
      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBoard ? "Edit Board" : "New Board"}</DialogTitle>
            <DialogDescription>
              {editingBoard
                ? "Update the board name and filters."
                : "Create a board with saved filters to show a subset of issues."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="boardName">Board Name</Label>
              <Input
                id="boardName"
                placeholder="e.g. Sprint 5, Frontend Team, Bugs"
                value={boardFormData.name}
                onChange={(e) => setBoardFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Filter by Type</Label>
                <Select
                  value={boardFormData.filterType || "__none__"}
                  onValueChange={(v) => setBoardFormData((prev) => ({ ...prev, filterType: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Types</SelectItem>
                    {Object.entries(TicketType).map(([, val]) => (
                      <SelectItem key={val} value={val}>{TicketTypeLabels[val]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Filter by Priority</Label>
                <Select
                  value={boardFormData.filterPriority || "__none__"}
                  onValueChange={(v) => setBoardFormData((prev) => ({ ...prev, filterPriority: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="All priorities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Priorities</SelectItem>
                    {Object.entries(TicketPriority).map(([, val]) => (
                      <SelectItem key={val} value={val}>{TicketPriorityLabels[val]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Filter by Sprint</Label>
                <Select
                  value={boardFormData.filterSprintId || "__none__"}
                  onValueChange={(v) => setBoardFormData((prev) => ({ ...prev, filterSprintId: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="All sprints" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Sprints</SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Filter by Assignee</Label>
                <Select
                  value={boardFormData.filterAssigneeId || "__none__"}
                  onValueChange={(v) => setBoardFormData((prev) => ({ ...prev, filterAssigneeId: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="All members" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Members</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBoardDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveBoard} disabled={boardSubmitting || !boardFormData.name} className="cursor-pointer">
              {boardSubmitting ? "Saving..." : editingBoard ? "Save Changes" : "Create Board"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={!!deleteBoardTarget}
        onOpenChange={(v) => { if (!v) setDeleteBoardTarget(null); }}
        onConfirm={confirmDeleteBoard}
        onCancel={() => setDeleteBoardTarget(null)}
        title="Delete Board"
        itemName={deleteBoardTarget?.name}
        itemType="board"
      />
    </div>
  );
}
