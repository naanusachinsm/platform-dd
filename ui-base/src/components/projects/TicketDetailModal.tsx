import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Pencil, Trash2, Send } from "lucide-react";
import type { ProjectAsset } from "@/api/projectTypes";
import MentionInput from "@/components/projects/MentionInput";
import MentionRenderer from "@/components/projects/MentionRenderer";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  TicketType,
  TicketPriority,
  TicketResolution,
  TicketTypeLabels,
  TicketPriorityLabels,
  TicketResolutionLabels,
} from "@/api/projectTypes";
import type {
  Ticket,
  TicketComment,
  BoardColumn,
  Sprint,
  UserSummary,
  CreateTicketRequest,
  UpdateTicketRequest,
} from "@/api/projectTypes";
import { projectService } from "@/api/projectService";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/common";

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  ticket?: Ticket | null;
  columns: BoardColumn[];
  sprints: Sprint[];
  members: UserSummary[];
  onSaved: () => void;
}

const TICKET_TYPES = [
  TicketType.EPIC,
  TicketType.STORY,
  TicketType.TASK,
  TicketType.BUG,
] as const;

const TICKET_PRIORITIES = [
  TicketPriority.HIGHEST,
  TicketPriority.HIGH,
  TicketPriority.MEDIUM,
  TicketPriority.LOW,
  TicketPriority.LOWEST,
] as const;

const TICKET_RESOLUTIONS = [
  TicketResolution.UNRESOLVED,
  TicketResolution.DONE,
  TicketResolution.WONT_DO,
  TicketResolution.DUPLICATE,
  TicketResolution.CANNOT_REPRODUCE,
] as const;

export default function TicketDetailModal({
  open,
  onOpenChange,
  projectId,
  ticket,
  columns,
  sprints,
  members,
  onSaved,
}: TicketDetailModalProps) {
  const isEdit = !!ticket;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>(TicketType.TASK);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [columnId, setColumnId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [parentId, setParentId] = useState("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [resolution, setResolution] = useState<TicketResolution>(
    TicketResolution.UNRESOLVED
  );
  const [labels, setLabels] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [epics, setEpics] = useState<Ticket[]>([]);

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([]);
  const currentUser = useAppStore((s) => s.user);

  useEffect(() => {
    if (open && projectId) {
      projectService.getTickets(projectId, { type: TicketType.EPIC, limit: 200 }).then((res) => {
        if (res.success && res.data) setEpics(res.data.data ?? []);
      });
      projectService.getAssets(projectId).then((res) => {
        if (res.success && res.data) setProjectAssets(res.data.data ?? []);
      });
    }
  }, [open, projectId]);

  const loadComments = useCallback(async () => {
    if (!ticket || !projectId) return;
    const res = await projectService.getComments(projectId, ticket.id);
    if (res.success && res.data) setComments(res.data.data ?? []);
  }, [ticket, projectId]);

  useEffect(() => {
    if (open && ticket) {
      loadComments();
    } else {
      setComments([]);
      setNewComment("");
      setEditingCommentId(null);
    }
  }, [open, ticket, loadComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;
    setCommentLoading(true);
    try {
      const res = await projectService.createComment(projectId, ticket.id, newComment.trim());
      if (res.success) {
        setNewComment("");
        loadComments();
      } else {
        toast.error(res.message ?? "Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim() || !ticket) return;
    setCommentLoading(true);
    try {
      const res = await projectService.updateComment(projectId, ticket.id, commentId, editingContent.trim());
      if (res.success) {
        setEditingCommentId(null);
        setEditingContent("");
        loadComments();
      } else {
        toast.error(res.message ?? "Failed to update comment");
      }
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentTarget(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!ticket || !deleteCommentTarget) return;
    try {
      const res = await projectService.deleteComment(projectId, ticket.id, deleteCommentTarget);
      if (res.success) {
        loadComments();
      } else {
        toast.error(res.message ?? "Failed to delete comment");
      }
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeleteCommentTarget(null);
    }
  };

  const showParentField = type !== TicketType.EPIC;

  useEffect(() => {
    if (open) {
      if (ticket) {
        setTitle(ticket.title);
        setDescription(ticket.description ?? "");
        setType(ticket.type);
        setPriority(ticket.priority);
        setColumnId(ticket.columnId);
        setAssigneeId(ticket.assigneeId ?? "");
        setSprintId(ticket.sprintId ?? "");
        setParentId(ticket.parentId ?? "");
        setStoryPoints(ticket.storyPoints?.toString() ?? "");
        setDueDate(ticket.dueDate ? new Date(ticket.dueDate) : undefined);
        setResolution(ticket.resolution);
        setLabels(ticket.labels?.join(", ") ?? "");
      } else {
        setTitle("");
        setDescription("");
        setType(TicketType.TASK);
        setPriority(TicketPriority.MEDIUM);
        setColumnId(columns[0]?.id ?? "");
        setAssigneeId("");
        setSprintId("");
        setParentId("");
        setStoryPoints("");
        setDueDate(undefined);
        setResolution(TicketResolution.UNRESOLVED);
        setLabels("");
      }
    }
  }, [open, ticket, columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const labelsArray = labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      if (isEdit && ticket) {
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
        const response = await projectService.updateTicket(
          projectId,
          ticket.id,
          data
        );
        if (response.success) {
          toast.success("Issue updated successfully");
          onSaved();
          onOpenChange(false);
        } else {
          toast.error(response.message ?? "Failed to update issue");
        }
      } else {
        const data: CreateTicketRequest = {
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
          labels: labelsArray.length > 0 ? labelsArray : undefined,
        };
        const response = await projectService.createTicket(projectId, data);
        if (response.success) {
          toast.success("Issue created successfully");
          onSaved();
          onOpenChange(false);
        } else {
          toast.error(response.message ?? "Failed to create issue");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-lg overflow-hidden">
        <div className="shrink-0 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Issue" : "Create Issue"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the issue details below."
                : "Fill in the details to create a new issue."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-xs text-muted-foreground font-normal">(@mention users, #mention assets)</span></Label>
              <MentionInput
                value={description}
                onChange={setDescription}
                members={members}
                assets={projectAssets}
                currentUserId={currentUser?.id}
                multiline
                placeholder="Issue description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TicketTypeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TicketPriority)}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TicketPriorityLabels[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint">Sprint</Label>
                <Select
                  value={sprintId || "__none__"}
                  onValueChange={(v) => setSprintId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="sprint" className="w-full">
                    <SelectValue placeholder="Select Sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Backlog</SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={assigneeId || "__none__"}
                  onValueChange={(v) => setAssigneeId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="assignee" className="w-full">
                    <SelectValue placeholder="Select Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="capitalize">
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storyPoints">Story Points</Label>
                <Input
                  id="storyPoints"
                  type="number"
                  min={0}
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labels">Labels</Label>
                <Input
                  id="labels"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                  placeholder="Comma-separated labels"
                />
              </div>
              {showParentField && (
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Epic</Label>
                  <Select
                    value={parentId || "__none__"}
                    onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger id="parentId" className="w-full">
                      <SelectValue placeholder="Select Epic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {epics
                        .filter((e) => e.id !== ticket?.id)
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.ticketKey} — {e.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select
                  value={resolution}
                  onValueChange={(v) =>
                    setResolution(v as TicketResolution)
                  }
                >
                  <SelectTrigger id="resolution" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_RESOLUTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {TicketResolutionLabels[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isEdit && ticket && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Comments</h4>

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
                        assets={projectAssets}
                        currentUserId={currentUser?.id}
                        placeholder="Add a comment... (@user, #asset)"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={commentLoading || !newComment.trim()}
                      >
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No comments yet.</p>
                  ) : (
                    <div className="space-y-3">
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
                                    assets={projectAssets}
                                    currentUserId={currentUser?.id}
                                    autoFocus
                                  />
                                  <Button type="button" size="sm" onClick={() => handleUpdateComment(comment.id)} disabled={commentLoading}>
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setEditingCommentId(null); setEditingContent(""); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <MentionRenderer
                                  content={comment.content}
                                  assets={projectAssets}
                                  className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words"
                                />
                              )}

                              {isOwn && editingCommentId !== comment.id && (
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 border-t px-6 py-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmDeleteDialog
      isOpen={!!deleteCommentTarget}
      onOpenChange={(v) => { if (!v) setDeleteCommentTarget(null); }}
      onConfirm={confirmDeleteComment}
      onCancel={() => setDeleteCommentTarget(null)}
      title="Delete Comment"
      description="Are you sure you want to delete this comment? This action cannot be undone."
      itemType="comment"
    />
    </>
  );
}
