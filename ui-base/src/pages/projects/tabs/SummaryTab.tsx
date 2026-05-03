import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  TicketCheck,
  Milestone,
  Kanban,
  Users,
  CalendarDays,
  Target,
  Clock,
  Plus,
  PenLine,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";

import { projectService } from "@/api/projectService";
import type {
  Project,
  ProjectSummary,
  ProjectActivity,
  Sprint,
  ProjectMember,
} from "@/api/projectTypes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SummaryTabProps {
  project: Project;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: PenLine,
  DELETE: Trash2,
};

const ACTION_DOT_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-red-500",
};

const ENTITY_BADGE_COLORS: Record<string, string> = {
  TICKET:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  SPRINT:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  BOARD: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  MEMBER: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  ASSET:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

function getInitials(firstName?: string, lastName?: string): string {
  return (
    ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() ||
    "?"
  );
}

function entityLabel(type: string): string {
  return type === "TICKET"
    ? "Issue"
    : type.charAt(0) + type.slice(1).toLowerCase();
}

function getStatusColor(status: string): { bar: string; dot: string } {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("complete"))
    return {
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
    };
  if (s.includes("progress") || s.includes("review") || s.includes("doing"))
    return {
      bar: "bg-amber-500",
      dot: "bg-amber-500",
    };
  return {
    bar: "bg-slate-300 dark:bg-slate-600",
    dot: "bg-slate-300 dark:bg-slate-600",
  };
}

export default function SummaryTab({ project }: SummaryTabProps) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, activityRes, sprintRes, memberRes] =
        await Promise.all([
          projectService.getProjectSummary(project.id),
          projectService.getProjectActivity(project.id, {
            page: 1,
            limit: 8,
          }),
          projectService.getSprints(project.id),
          projectService.getMembers(project.id),
        ]);
      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (activityRes.success && activityRes.data)
        setActivities(activityRes.data.data ?? []);
      if (sprintRes.success && sprintRes.data)
        setSprints(sprintRes.data.data ?? []);
      if (memberRes.success && memberRes.data)
        setMembers(memberRes.data.data ?? []);
    } catch {
      toast.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusCounts = useMemo(() => {
    if (!summary?.statusDistribution?.length)
      return { todo: 0, inProgress: 0, done: 0 };
    let done = 0,
      inProgress = 0,
      todo = 0;
    for (const { status, count } of summary.statusDistribution) {
      const s = status.toLowerCase();
      if (s.includes("done") || s.includes("complete")) done += count;
      else if (
        s.includes("progress") ||
        s.includes("review") ||
        s.includes("doing")
      )
        inProgress += count;
      else todo += count;
    }
    return { todo, inProgress, done };
  }, [summary]);

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "ACTIVE") ?? null,
    [sprints]
  );

  const sprintTimeInfo = useMemo(() => {
    if (!activeSprint?.startDate || !activeSprint?.endDate) return null;
    const now = new Date();
    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsed = Math.max(0, differenceInDays(now, start));
    const remaining = Math.max(0, differenceInDays(end, now));
    const timePercent = Math.min(
      100,
      Math.round((elapsed / totalDays) * 100)
    );
    return { totalDays, elapsed, remaining, timePercent };
  }, [activeSprint]);

  if (loading || !summary) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-muted rounded-xl animate-pulse" />
          <div className="h-72 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const total = summary.totalTickets;
  const completionPercent =
    total > 0 ? Math.round((statusCounts.done / total) * 100) : 0;

  const kpis = [
    {
      label: "Issues",
      value: summary.totalTickets,
      icon: TicketCheck,
      sub: `${statusCounts.done} completed · ${statusCounts.inProgress} in progress`,
    },
    {
      label: "Sprints",
      value: summary.totalSprints,
      icon: Milestone,
      sub: `${summary.activeSprints} active · ${summary.completedSprints} completed`,
    },
    {
      label: "Boards",
      value: summary.totalBoards,
      icon: Kanban,
      sub: "Saved board views",
    },
    {
      label: "Members",
      value: summary.totalMembers,
      icon: Users,
      sub: `${summary.activeMembers} active · ${summary.inactiveMembers} inactive`,
    },
  ];

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="gap-1">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">
                    {kpi.label}
                  </CardDescription>
                  <kpi.icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Activity + Sprint/Progress/Team ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Timeline */}
          <Card className="lg:col-span-2 gap-2">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Clock className="size-8 mb-2 opacity-40" />
                  <p className="text-sm">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {activities.map((entry, idx) => {
                    const Icon = ACTION_ICONS[entry.action] ?? PenLine;
                    const dotColor =
                      ACTION_DOT_COLORS[entry.action] ?? "bg-gray-400";
                    const userName = entry.performedByUser
                      ? `${entry.performedByUser.firstName ?? ""} ${entry.performedByUser.lastName ?? ""}`.trim()
                      : "System";
                    const isLast = idx === activities.length - 1;

                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "size-7 rounded-full flex items-center justify-center shrink-0",
                              dotColor
                            )}
                          >
                            <Icon className="size-3.5 text-white" />
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-border min-h-6" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "pb-5 min-w-0 flex-1",
                            isLast && "pb-0"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium capitalize">
                              {userName}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4",
                                ENTITY_BADGE_COLORS[entry.entityType] ?? ""
                              )}
                            >
                              {entityLabel(entry.entityType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                            {entry.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {formatDistanceToNow(new Date(entry.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Progress + Sprint + Team */}
          <div className="space-y-6">
            {/* Issue Progress */}
            {total > 0 && (
              <Card className="gap-2">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Issue Progress
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-medium">
                      {completionPercent}% complete
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted gap-0.5">
                    {summary.statusDistribution.map((entry) => {
                      if (entry.count <= 0) return null;
                      const colors = getStatusColor(entry.status);
                      return (
                        <Tooltip key={entry.status}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                colors.bar,
                                "transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                              )}
                              style={{
                                width: `${(entry.count / total) * 100}%`,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry.status}: {entry.count}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-5 text-xs flex-wrap">
                    {summary.statusDistribution.map((entry) => {
                      const colors = getStatusColor(entry.status);
                      return (
                        <div
                          key={entry.status}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className={cn(
                              "size-2.5 rounded-full",
                              colors.dot
                            )}
                          />
                          <span className="text-muted-foreground">
                            {entry.status}
                          </span>
                          <span className="font-medium">{entry.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Sprint */}
            <Card className="gap-2">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Active Sprint
                  </CardTitle>
                  {activeSprint && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px]"
                    >
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeSprint ? (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">
                      {activeSprint.name}
                    </p>

                    {activeSprint.goal && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Target className="size-3.5 mt-0.5 shrink-0" />
                        <span>{activeSprint.goal}</span>
                      </div>
                    )}

                    {activeSprint.startDate && activeSprint.endDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span>
                          {format(new Date(activeSprint.startDate), "MMM d")} –{" "}
                          {format(
                            new Date(activeSprint.endDate),
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>
                    )}

                    {sprintTimeInfo && (
                      <>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {sprintTimeInfo.remaining} day
                            {sprintTimeInfo.remaining !== 1 ? "s" : ""}{" "}
                            remaining
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Timeline</span>
                            <span>
                              Day{" "}
                              {Math.min(
                                sprintTimeInfo.elapsed + 1,
                                sprintTimeInfo.totalDays
                              )}{" "}
                              of {sprintTimeInfo.totalDays}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all duration-500"
                              style={{
                                width: `${sprintTimeInfo.timePercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No active sprint
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card className="gap-2">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Team</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {members.length} member
                    {members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No members added
                  </p>
                ) : (
                  <div className="space-y-3">
                    {members.slice(0, 6).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2.5"
                      >
                        <Avatar className="size-7">
                          {member.user?.avatarUrl && (
                            <AvatarImage src={member.user.avatarUrl} alt="" />
                          )}
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {getInitials(
                              member.user?.firstName,
                              member.user?.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate capitalize">
                            {member.user
                              ? `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim()
                              : "Unknown"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 shrink-0"
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                    {members.length > 6 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{members.length - 6} more member
                        {members.length - 6 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
