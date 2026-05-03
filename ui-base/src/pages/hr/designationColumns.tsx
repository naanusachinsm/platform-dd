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
import type { HrDesignation } from "@/api/hrTypes";
import {
  HrDesignationStatusLabels,
  HrDesignationStatusColors,
} from "@/api/hrTypes";
import { DataTableColumnHeader } from "@/components/common/DataTable";

interface DesignationColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (designation: HrDesignation) => void;
  onEdit: (designation: HrDesignation) => void;
  onDelete: (designation: HrDesignation) => void;
}

export const createDesignationColumns = ({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: DesignationColumnsProps): ColumnDef<HrDesignation>[] => [
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
    accessorKey: "departmentId",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.departmentId || "-"}
      </span>
    ),
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("level") ?? "-"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof HrDesignationStatusLabels;
      return (
        <Badge className={HrDesignationStatusColors[status]}>
          {HrDesignationStatusLabels[status] || status}
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
