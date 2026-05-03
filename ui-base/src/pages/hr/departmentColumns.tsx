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
import type { HrDepartment } from "@/api/hrTypes";
import {
  HrDepartmentStatusLabels,
  HrDepartmentStatusColors,
} from "@/api/hrTypes";
import { DataTableColumnHeader } from "@/components/common/DataTable";

interface DepartmentColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (department: HrDepartment) => void;
  onEdit: (department: HrDepartment) => void;
  onDelete: (department: HrDepartment) => void;
}

export const createDepartmentColumns = ({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: DepartmentColumnsProps): ColumnDef<HrDepartment>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.getValue("description") as string | undefined;
      if (!desc) return <span className="text-muted-foreground">-</span>;
      const truncated = desc.length > 50 ? `${desc.slice(0, 50)}...` : desc;
      return (
        <span className="text-sm text-muted-foreground" title={desc}>
          {truncated}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof HrDepartmentStatusLabels;
      return (
        <Badge className={HrDepartmentStatusColors[status]}>
          {HrDepartmentStatusLabels[status] || status}
        </Badge>
      );
    },
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
            {canPerformAction(ActionType.DELETE) && item.organizationId && (
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
