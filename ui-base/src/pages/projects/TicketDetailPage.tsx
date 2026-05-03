import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar as CalendarIcon, Send, Save } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";

import { projectService } from "@/api/projectService";
import type {
  Project,
  Ticket,
  TicketComment,
  BoardColumn,
  Sprint,
  UserSummary,
  UpdateTicketRequest,
  ProjectAsset,
} from "@/api/projectTypes";
import {
  TicketType,
  TicketPriority,
  TicketResolution,
  TicketTypeLabels,
  TicketPriorityLabels,
  TicketResolutionLabels,
} from "@/api/projectTypes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDeleteDialog } from "@/components/common";
import MentionInput from "@/components/projects/MentionInput";
import MentionRenderer from "@/components/projects/MentionRenderer";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/dateFormat";

const TICKET_TYPES = [TicketType.EPIC, TicketType.STORY, TicketType.TASK, TicketType.BUG] as const;
const TICKET_PRIORITIES = [TicketPriority.HIGHEST, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW, TicketPriority.LOWEST] as const;
const TICKET_RESOLUTIONS = [TicketResolution.UNRESOLVED, TicketResolution.DONE, TicketResolution.WONT_DO, TicketResolution.DUPLICATE, TicketResolution.CANNOT_REPRODUCE] as const;

export default function TicketDetailPage() {
  const { projectKey, ticketNumber } = useParams<{ projectKey: string; ticketNumber: string }>();
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.user);

  const [project, setProject] = useState<Project | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<UserSummary[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [epics, setEpics] = useState<Ticket[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>(TicketType.TASK);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [columnId, setColumnId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [parentId, setParentId] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [resolution, setResolution] = useState<TicketResolution>(TicketResolution.UNRESOLVED);
  const [labels, setLabels] = useState("");

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null);

  const populateForm = useCallback((t: Ticket) => {
    setTitle(t.title);
    setDescription(t.description ?? "");
    setType(t.type);
    setPriority(t.priority);
    setColumnId(t.columnId);
    setAssigneeId(t.assigneeId ?? "");
    setSprintId(t.sprintId ?? "");
    setParentId(t.parentId ?? "");
    setStoryPoints(t.storyPoints?.toString() ?? "");
    setDueDate(t.dueDate ? new Date(t.dueDate) : undefined);
    setResolution(t.resolution);
    setLabels(t.labels?.join(", ") ?? "");
  }, []);

  useEffect(() => {
    if (!projectKey || !ticketNumber) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const projRes = await projectService.getProjectByKey(projectKey);
        if (!projRes.success || !projRes.data) {
          toast.error("Project not found");
          navigate("/dashboard/projects");
          return;
        }
        const proj = projRes.data;
        if (!cancelled) setProject(proj);

        const [ticketRes, membersRes, sprintsRes, columnsRes, assetsRes, epicsRes] = await Promise.all([
          projectService.getTicketByNumber(proj.id, parseInt(ticketNumber, 10)),
          projectService.getMembers(proj.id),
          projectService.getSprints(proj.id),
          projectService.getColumns(),
          projectService.getAssets(proj.id),
          projectService.getTickets(proj.id, { type: TicketType.EPIC, limit: 200 }),
        ]);

        if (!cancelled) {
          if (ticketRes.success && ticketRes.data) {
            setTicket(ticketRes.data);
            populateForm(ticketRes.data);
          } else {
            toast.error("Ticket not found");
            navigate(`/dashboard/projects/${projectKey}`);
            return;
          }
          if (membersRes.success && membersRes.data)
            setMembers(membersRes.data.data?.map((m: any) => m.user).filter(Boolean) ?? []);
          if (sprintsRes.success && sprintsRes.data) setSprints(sprintsRes.data.data ?? []);
          if (columnsRes.success && columnsRes.data) setColumns(columnsRes.data.data ?? []);
          if (assetsRes.success && assetsRes.data) setAssets(assetsRes.data.data ?? []);
          if (epicsRes.success && epicsRes.data) setEpics(epicsRes.data.data ?? []);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load ticket");
          navigate("/dashboard/projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [projectKey, ticketNumber, navigate, populateForm]);

  useEffect(() => {
    if (!project || !ticket) return;
    projectService.getComments(project.id, ticket.id).then((res) => {
      if (res.success && res.data) setComments(res.data.data ?? []);
    });
  }, [project, ticket]);

  const loadComments = useCallback(async () => {
    if (!project || !ticket) return;
    const res = await projectService.getComments(project.id, ticket.id);
    if (res.success && res.data) setComments(res.data.data ?? []);
  }, [project, ticket]);

  const handleSave = async () => {
    if (!project || !ticket || !title.trim()) return;
    setSaving(true);
    try {
      const labelsArray = labels.split(",").map((l) => l.trim()).filter(Boolean);
      const showParentField = type !== TicketType.EPIC;
      const data: UpdateTicketRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        columnId: columnId || undefined,
        assigneeId: assigneeId || undefined,
        sprintId: sprintId || undefined,
        parentId: showParentField && parentId ? parentId : undefined,
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        resolution,
        labels: labelsArray.length > 0 ? labelsArray : undefined,
      };
      const res = await projectService.updateTicket(project.id, ticket.id, data);
      if (res.success) {
        toast.success("Ticket updated");
        if (res.data) { setTicket(res.data); populateForm(res.data); }
      } else {
        toast.error(res.message ?? "Failed to update");
      }
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !project || !ticket) return;
    setCommentLoading(true);
    try {
      const res = await projectService.createComment(project.id, ticket.id, newComment.trim());
      if (res.success) { setNewComment(""); loadComments(); }
      else toast.error(res.message ?? "Failed to add comment");
    } catch { toast.error("Failed to add comment"); }
    finally { setCommentLoading(false); }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim() || !project || !ticket) return;
    setCommentLoading(true);
    try {
      const res = await projectService.updateComment(project.id, ticket.id, commentId, editingContent.trim());
      if (res.success) { setEditingCommentId(null); setEditingContent(""); loadComments(); }
      else toast.error(res.message ?? "Failed to update comment");
    } catch { toast.error("Failed to update comment"); }
    finally { setCommentLoading(false); }
  };

  const confirmDeleteComment = async () => {
    if (!project || !ticket || !deleteCommentTarget) return;
    try {
      const res = await projectService.deleteComment(project.id, ticket.id, deleteCommentTarget);
      if (res.success) loadComments();
      else toast.error(res.message ?? "Failed to delete comment");
    } catch { toast.error("Failed to delete comment"); }
    finally { setDeleteCommentTarget(null); }
  };

  const getInitials = (firstName?: string, lastName?: string) =>
    ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";

  const capitalize = (s?: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!project || !ticket) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Ticket not found
      </div>
    );
  }

  const showParentField = type !== TicketType.EPIC;

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden border-t">
      {/* Content */}
      <div className="flex-1 lg:h-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:h-full">
          {/* Left Column - Fields */}
          <div className="p-6 space-y-5 lg:overflow-y-auto lg:border-r">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" />
            </div>

            <div className="space-y-2">
              <Label>Description <span className="text-xs text-muted-foreground font-normal">(@mention users, #mention assets)</span></Label>
              <MentionInput value={description} onChange={setDescription} members={members} assets={assets} currentUserId={currentUser?.id} multiline placeholder="Issue description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map((t) => <SelectItem key={t} value={t}>{TicketTypeLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{TicketPriorityLabels[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={columnId} onValueChange={setColumnId}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sprint</Label>
                <Select value={sprintId || "__none__"} onValueChange={(v) => setSprintId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Backlog</SelectItem>
                    {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assigneeId || "__none__"} onValueChange={(v) => setAssigneeId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {members.map((m) => <SelectItem key={m.id} value={m.id} className="capitalize">{m.firstName} {m.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Story Points</Label>
                <Input type="number" min={0} value={storyPoints} onChange={(e) => setStoryPoints(e.target.value)} placeholder="e.g. 3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Due Date
                  {dueDate && isPast(dueDate) && resolution === TicketResolution.UNRESOLVED && (
                    <span className="text-destructive text-xs font-normal">(Overdue)</span>
                  )}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Labels</Label>
                <Input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="Comma-separated labels" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as TicketResolution)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_RESOLUTIONS.map((r) => <SelectItem key={r} value={r}>{TicketResolutionLabels[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {showParentField && (
                <div className="space-y-2">
                  <Label>Parent Epic</Label>
                  <Select value={parentId || "__none__"} onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {epics.filter((e) => e.id !== ticket.id).map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.ticketKey} — {e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Children */}
            {ticket.children && ticket.children.length > 0 && (
              <div className="space-y-2">
                <Label>Child Issues</Label>
                <div className="space-y-1">
                  {ticket.children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/dashboard/projects/${projectKey}/tickets/${child.ticketNumber}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                      <Badge variant="outline" className="font-mono text-xs">{child.ticketKey}</Badge>
                      <span className="text-sm capitalize truncate">{child.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Reporter: </span>
                {ticket.reporter ? `${capitalize(ticket.reporter.firstName)} ${capitalize(ticket.reporter.lastName)}` : "—"}
              </div>
              <div>
                <span className="font-medium text-foreground">Created: </span>
                {formatDateTime(ticket.createdAt)}
              </div>
              <div>
                <span className="font-medium text-foreground">Updated: </span>
                {formatDateTime(ticket.updatedAt)}
              </div>
              {ticket.parent && (
                <div>
                  <span className="font-medium text-foreground">Parent: </span>
                  <Link to={`/dashboard/projects/${projectKey}/tickets/${ticket.parent.ticketKey.split("-")[1]}`} className="text-primary hover:underline">
                    {ticket.parent.ticketKey}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer gap-1.5">
                <Save className="size-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Right Column - Comments */}
          <div className="flex flex-col border-t lg:border-t-0 lg:overflow-hidden">
            <div className="p-6 space-y-6 lg:flex-1 lg:overflow-y-auto">
              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Comments</h3>

                <div className="flex gap-2">
                  <Avatar className="size-7 shrink-0 mt-0.5">
                    {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt="" />}
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(currentUser?.firstName, currentUser?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <MentionInput
                      value={newComment}
                      onChange={setNewComment}
                      onSubmit={handleAddComment}
                      members={members}
                      assets={assets}
                      currentUserId={currentUser?.id}
                      placeholder="Add a comment... (@user, #asset)"
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={commentLoading || !newComment.trim()}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No comments yet.</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const isOwn = currentUser?.id === comment.authorId;
                      const authorName = comment.author
                        ? `${comment.author.firstName ?? ""} ${comment.author.lastName ?? ""}`.trim()
                        : "Unknown";

                      return (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="size-7 shrink-0 mt-0.5">
                            {comment.author?.avatarUrl && <AvatarImage src={comment.author.avatarUrl} alt="" />}
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(comment.author?.firstName, comment.author?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">{authorName}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                {comment.updatedAt !== comment.createdAt && " (edited)"}
                              </span>
                            </div>

                            {editingCommentId === comment.id ? (
                              <div className="flex gap-2 mt-1">
                                <MentionInput
                                  value={editingContent}
                                  onChange={setEditingContent}
                                  onSubmit={() => handleUpdateComment(comment.id)}
                                  members={members}
                                  assets={assets}
                                  currentUserId={currentUser?.id}
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => handleUpdateComment(comment.id)} disabled={commentLoading}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingCommentId(null); setEditingContent(""); }}>Cancel</Button>
                              </div>
                            ) : (
                              <MentionRenderer content={comment.content} assets={assets} className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words" />
                            )}

                            {isOwn && editingCommentId !== comment.id && (
                              <div className="flex items-center gap-2 mt-1">
                                <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}>Edit</button>
                                <button type="button" className="text-xs text-muted-foreground hover:text-destructive transition-colors" onClick={() => setDeleteCommentTarget(comment.id)}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteCommentTarget}
        onOpenChange={(v) => { if (!v) setDeleteCommentTarget(null); }}
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentTarget(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        itemType="comment"
      />
    </div>
  );
}
