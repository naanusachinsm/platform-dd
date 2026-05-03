import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Calendar as CalendarIcon, Upload, X, FileIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

import { projectService } from "@/api/projectService";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import type { Project, Sprint, BoardColumn, UserSummary, CreateBoardRequest } from "@/api/projectTypes";
import {
  TicketType,
  TicketPriority,
  TicketTypeLabels,
  TicketPriorityLabels,
} from "@/api/projectTypes";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TicketDetailModal from "@/components/projects/TicketDetailModal";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import SummaryTab from "./tabs/SummaryTab";
import BacklogTab from "./tabs/BacklogTab";
import BoardTab from "./tabs/BoardTab";
import ActiveSprintsTab from "./tabs/ActiveSprintsTab";
import ListTab from "./tabs/ListTab";
import ActivityTab from "./tabs/ActivityTab";
import AssetsTab from "./tabs/AssetsTab";
type TabId = "summary" | "backlog" | "board" | "active-sprints" | "list" | "assets" | "activity";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "backlog", label: "Backlog" },
  { id: "board", label: "Board" },
  { id: "active-sprints", label: "Active Sprints" },
  { id: "list", label: "List" },
  { id: "assets", label: "Assets" },
  { id: "activity", label: "Activity" },
];

export default function ProjectDetailPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppStore();

  const activeTab = (searchParams.get("tab") as TabId) || "summary";

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<UserSummary[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState<{
    name: string;
    goal: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ name: "", goal: "", startDate: undefined, endDate: undefined });
  const [sprintSubmitting, setSprintSubmitting] = useState(false);
  const [newBoardData, setNewBoardData] = useState<CreateBoardRequest>({ name: "" });
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadAssetOpen, setUploadAssetOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetDragOver, setAssetDragOver] = useState(false);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  const [ticketActions, setTicketActions] = useState<string[]>([]);
  const [sprintActions, setSprintActions] = useState<string[]>([]);
  const [boardActions, setBoardActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    Promise.all([
      roleService.getRoleActions(user.role, ModuleName.TICKET),
      roleService.getRoleActions(user.role, ModuleName.SPRINT),
      roleService.getRoleActions(user.role, ModuleName.BOARD),
    ]).then(([tickRes, sprintRes, boardRes]) => {
      if (tickRes.success && tickRes.data) setTicketActions(tickRes.data.actions || []);
      if (sprintRes.success && sprintRes.data) setSprintActions(sprintRes.data.actions || []);
      if (boardRes.success && boardRes.data) setBoardActions(boardRes.data.actions || []);
    });
  }, [user]);

  const canCreateTicket = useMemo(() => ticketActions.includes(ActionType.CREATE), [ticketActions]);
  const canCreateSprint = useMemo(() => sprintActions.includes(ActionType.CREATE), [sprintActions]);
  const canCreateBoard = useMemo(() => boardActions.includes(ActionType.CREATE), [boardActions]);
  const hasAnyCreateAction = canCreateTicket || canCreateSprint || canCreateBoard;

  const handleAssetSubmit = async () => {
    if (!project || !pendingFiles.length) return;
    setAssetUploading(true);
    try {
      for (const file of pendingFiles) {
        const res = await projectService.uploadAndCreateAsset(project.id, file);
        if (!res.success) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      toast.success(`${pendingFiles.length} file(s) uploaded`);
      setPendingFiles([]);
      setUploadAssetOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Upload failed");
    } finally {
      setAssetUploading(false);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const existing = new Set(pendingFiles.map((f) => `${f.name}-${f.size}`));
    const newFiles = Array.from(files).filter((f) => !existing.has(`${f.name}-${f.size}`));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const loadProject = useCallback(async () => {
    if (!projectKey) return null;
    try {
      const res = await projectService.getProjectByKey(projectKey);
      if (res.success && res.data) {
        setProject(res.data);
        return res.data;
      }
      toast.error(res.message ?? "Project not found");
      navigate("/dashboard/projects");
    } catch {
      toast.error("Failed to load project");
      navigate("/dashboard/projects");
    }
    return null;
  }, [projectKey, navigate]);

  const loadSharedData = useCallback(async (projectId: string) => {
    const [membersRes, sprintsRes, columnsRes] = await Promise.all([
      projectService.getMembers(projectId),
      projectService.getSprints(projectId),
      projectService.getColumns(),
    ]);

    if (membersRes.success && membersRes.data) {
      setMembers(
        membersRes.data.data?.map((m: any) => m.user).filter(Boolean) as UserSummary[] ?? []
      );
    }
    if (sprintsRes.success && sprintsRes.data) setSprints(sprintsRes.data.data ?? []);
    if (columnsRes.success && columnsRes.data) setColumns(columnsRes.data.data ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const proj = await loadProject();
      if (proj && !cancelled) await loadSharedData(proj.id);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadProject, loadSharedData]);

  const handleRefresh = useCallback(async () => {
    if (project) await loadSharedData(project.id);
  }, [project, loadSharedData]);

  const handleCreateSprint = async () => {
    if (!project || !sprintForm.name.trim()) return;
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
        setCreateSprintOpen(false);
        setSprintForm({ name: "", goal: "", startDate: undefined, endDate: undefined });
        await handleRefresh();
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(res.message || "Failed to create sprint");
      }
    } catch {
      toast.error("Failed to create sprint");
    } finally {
      setSprintSubmitting(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!project || !newBoardData.name) return;
    setBoardSubmitting(true);
    try {
      const res = await projectService.createBoard(project.id, newBoardData);
      if (res.success) {
        toast.success("Board created");
        setCreateBoardOpen(false);
        setNewBoardData({ name: "" });
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(res.message || "Failed to create board");
      }
    } catch {
      toast.error("Failed to create board");
    } finally {
      setBoardSubmitting(false);
    }
  };

  const handleIssueCreated = useCallback(async () => {
    await handleRefresh();
    setRefreshKey((k) => k + 1);
  }, [handleRefresh]);

  const setTab = (tab: TabId) => {
    setSearchParams({ tab }, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Project not found
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Tab Bar */}
      <div className="shrink-0 border-b">
        <div className="px-6 pt-3">
          <div className="flex items-center justify-between -mb-px">
            <div className="flex items-center gap-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                  onClick={() => setTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="cursor-pointer h-8 gap-1.5">
                  Create
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canCreateTicket && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setCreateIssueOpen(true)}>
                    Issue
                  </DropdownMenuItem>
                )}
                {canCreateSprint && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    const today = new Date();
                    const end = addDays(today, 14);
                    const sameMonth = today.getMonth() === end.getMonth();
                    const name = sameMonth
                      ? `Sprint-${format(today, "MMMM")}-${format(today, "d")}-to-${format(end, "d")}`
                      : `Sprint-${format(today, "MMMM")}-${format(today, "d")}-to-${format(end, "MMMM")}-${format(end, "d")}`;
                    setSprintForm({ name, goal: "", startDate: today, endDate: end });
                    setCreateSprintOpen(true);
                  }}>
                    Sprint
                  </DropdownMenuItem>
                )}
                {canCreateBoard && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setCreateBoardOpen(true)}>
                    Board
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={() => { setPendingFiles([]); setUploadAssetOpen(true); }}>
                  Upload Asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "summary" && <SummaryTab key={refreshKey} project={project} />}
        {activeTab === "backlog" && (
          <BacklogTab key={refreshKey} project={project} members={members} sprints={sprints} columns={columns} onRefresh={handleRefresh} />
        )}
        {activeTab === "board" && (
          <BoardTab key={refreshKey} project={project} members={members} sprints={sprints} onRefresh={handleRefresh} />
        )}
        {activeTab === "active-sprints" && (
          <ActiveSprintsTab key={refreshKey} project={project} members={members} sprints={sprints} columns={columns} onRefresh={handleRefresh} />
        )}
        {activeTab === "list" && (
          <ListTab key={refreshKey} project={project} members={members} sprints={sprints} columns={columns} onRefresh={handleRefresh} />
        )}
        {activeTab === "assets" && (
          <AssetsTab key={refreshKey} project={project} />
        )}
        {activeTab === "activity" && (
          <ActivityTab key={refreshKey} project={project} />
        )}
      </div>

      {/* Create Issue Modal */}
      <TicketDetailModal
        open={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
        projectId={project.id}
        ticket={null}
        columns={columns}
        sprints={sprints}
        members={members}
        onSaved={handleIssueCreated}
      />

      {/* Create Sprint Dialog */}
      <Dialog open={createSprintOpen} onOpenChange={setCreateSprintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>Create a new sprint for this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-sprint-name">Name *</Label>
              <Input
                id="create-sprint-name"
                placeholder="e.g. Sprint 1"
                value={sprintForm.name}
                onChange={(e) => setSprintForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-sprint-goal">Goal</Label>
              <Textarea
                id="create-sprint-goal"
                placeholder="What should the team accomplish?"
                value={sprintForm.goal}
                rows={3}
                onChange={(e) => setSprintForm((p) => ({ ...p, goal: e.target.value }))}
              />
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
            <Button variant="outline" onClick={() => setCreateSprintOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateSprint} disabled={sprintSubmitting || !sprintForm.name.trim()} className="cursor-pointer">
              {sprintSubmitting ? "Creating..." : "Create Sprint"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Board Dialog */}
      <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
            <DialogDescription>Create a board with saved filters to show a subset of issues.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-board-name">Board Name</Label>
              <Input
                id="create-board-name"
                placeholder="e.g. Sprint 5, Frontend Team, Bugs"
                value={newBoardData.name}
                onChange={(e) => setNewBoardData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Filter by Type</Label>
                <Select
                  value={newBoardData.filterType || "__none__"}
                  onValueChange={(v) => setNewBoardData((prev) => ({ ...prev, filterType: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
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
                  value={newBoardData.filterPriority || "__none__"}
                  onValueChange={(v) => setNewBoardData((prev) => ({ ...prev, filterPriority: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="All priorities" /></SelectTrigger>
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
                  value={newBoardData.filterSprintId || "__none__"}
                  onValueChange={(v) => setNewBoardData((prev) => ({ ...prev, filterSprintId: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="All sprints" /></SelectTrigger>
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
                  value={newBoardData.filterAssigneeId || "__none__"}
                  onValueChange={(v) => setNewBoardData((prev) => ({ ...prev, filterAssigneeId: v === "__none__" ? undefined : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="All members" /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setCreateBoardOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateBoard} disabled={boardSubmitting || !newBoardData.name} className="cursor-pointer">
              {boardSubmitting ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Asset Dialog */}
      <Dialog open={uploadAssetOpen} onOpenChange={(open) => { setUploadAssetOpen(open); if (!open) setPendingFiles([]); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Assets</DialogTitle>
            <DialogDescription>Drag & drop files or browse to attach them to this project.</DialogDescription>
          </DialogHeader>

          <div
            onDragOver={(e) => { e.preventDefault(); setAssetDragOver(true); }}
            onDragLeave={() => setAssetDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setAssetDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
            onClick={() => assetFileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              assetDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <Upload className="size-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drag & drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Images, documents, spreadsheets and more</p>
            <input
              ref={assetFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {pendingFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploadAssetOpen(false)}>Cancel</Button>
            <Button onClick={handleAssetSubmit} disabled={assetUploading || pendingFiles.length === 0}>
              {assetUploading ? "Uploading..." : `Upload ${pendingFiles.length} file(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
