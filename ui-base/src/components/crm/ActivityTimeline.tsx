import { useState, useEffect, useCallback, useMemo } from "react";
import {
  StickyNote,
  Phone,
  Mail,
  CalendarCheck,
  CheckSquare,
  Plus,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { crmService } from "@/api/crmService";
import {
  ActivityType,
  ActivityTypeLabels,
  ActivityStatus,
  ActivityStatusLabels,
  type CrmActivity,
} from "@/api/crmTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import ActivityModal from "./ActivityModal";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  [ActivityType.NOTE]: StickyNote,
  [ActivityType.CALL]: Phone,
  [ActivityType.EMAIL]: Mail,
  [ActivityType.MEETING]: CalendarCheck,
  [ActivityType.TASK]: CheckSquare,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  [ActivityType.NOTE]: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  [ActivityType.CALL]: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  [ActivityType.EMAIL]: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  [ActivityType.MEETING]: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
  [ActivityType.TASK]: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
};

const STATUS_COLORS: Record<ActivityStatus, string> = {
  [ActivityStatus.PLANNED]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  [ActivityStatus.COMPLETED]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [ActivityStatus.CANCELLED]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface ActivityTimelineProps {
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

export default function ActivityTimeline({
  contactId,
  companyId,
  dealId,
}: ActivityTimelineProps) {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.CRM_ACTIVITY).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(() => moduleActions.includes(ActionType.DELETE), [moduleActions]);

  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CrmActivity | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<CrmActivity | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (contactId) params.contactId = contactId;
      if (companyId) params.companyId = companyId;
      if (dealId) params.dealId = dealId;
      if (typeFilter !== "all") params.type = typeFilter;
      params.limit = "50";

      const response = await crmService.getActivities(params);
      if (response.success && response.data) {
        setActivities(response.data.data);
      }
    } catch {
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [contactId, companyId, dealId, typeFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDeleteClick = (activity: CrmActivity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      const response = await crmService.deleteActivity(activityToDelete.id);
      if (response.success) {
        toast.success("Activity deleted");
        fetchActivities();
      } else {
        toast.error(response.message || "Failed to delete activity");
      }
    } catch {
      toast.error("Failed to delete activity");
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const openCreateModal = () => {
    setEditingActivity(undefined);
    setModalOpen(true);
  };

  const openEditModal = (activity: CrmActivity) => {
    setEditingActivity(activity);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ActivityType).map(([, val]) => (
                <SelectItem key={val} value={val}>
                  {ActivityTypeLabels[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreateModal} className="cursor-pointer">
          <Plus className="size-4 mr-1" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <StickyNote className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activities yet</p>
          <p className="text-xs mt-1">Add a note, call, or meeting to get started</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type];
              return (
                <div key={activity.id} className="relative flex gap-3 pl-2">
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center size-8 rounded-full shrink-0",
                      ACTIVITY_COLORS[activity.type]
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div
                    className="flex-1 rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openEditModal(activity)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.subject}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[activity.status])}
                        >
                          {ActivityStatusLabels[activity.status]}
                        </Badge>
                        {canDelete && (
                          <button
                            className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(activity);
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(new Date(activity.activityDate), "MMM d, yyyy h:mm a")}
                      </span>
                      {activity.durationMinutes && (
                        <span>{activity.durationMinutes} min</span>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ActivityTypeLabels[activity.type]}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        activity={editingActivity}
        onSaved={fetchActivities}
        contactId={contactId}
        companyId={companyId}
        dealId={dealId}
      />

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={activityToDelete?.subject}
          itemType="activity"
        />
      )}
    </div>
  );
}
