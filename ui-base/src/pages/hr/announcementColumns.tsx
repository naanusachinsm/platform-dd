import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActionType } from "@/api/roleTypes";
import type { HrAnnouncement } from "@/api/hrTypes";
import {
  HrAnnouncementTypeLabels,
  HrAnnouncementPriorityLabels,
  HrAnnouncementPriorityColors,
  HrAnnouncementStatusLabels,
  HrAnnouncementStatusColors,
} from "@/api/hrTypes";
import { DataTableColumnHeader } from "@/components/common/DataTable";

interface AnnouncementColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (announcement: HrAnnouncement) => void;
  onEdit: (announcement: HrAnnouncement) => void;
  onDelete: (announcement: HrAnnouncement) => void;
}

export const createAnnouncementColumns = ({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: AnnouncementColumnsProps): ColumnDef<HrAnnouncement>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as keyof typeof HrAnnouncementTypeLabels;
      return (
        <Badge variant="outline">
          {HrAnnouncementTypeLabels[type] || type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as keyof typeof HrAnnouncementPriorityLabels;
      return (
        <Badge className={HrAnnouncementPriorityColors[priority]}>
          {HrAnnouncementPriorityLabels[priority] || priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof HrAnnouncementStatusLabels;
      return (
        <Badge className={HrAnnouncementStatusColors[status]}>
          {HrAnnouncementStatusLabels[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isPinned",
    header: "Pinned",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.getValue("isPinned") ? "Yes" : "No"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canPerformAction(ActionType.READ) && (
              <DropdownMenuItem onClick={() => onView(item)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            )}
            {canPerformAction(ActionType.UPDATE) && (
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {canPerformAction(ActionType.DELETE) && (
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="text-red-600 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
