import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import type { HrAttendance } from "@/api/hrTypes";
import { HrAttendanceStatusLabels, HrAttendanceStatusColors } from "@/api/hrTypes";
import { ActionType } from "@/api/roleTypes";

interface AttendanceColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (item: HrAttendance) => void;
  onEdit: (item: HrAttendance) => void;
  onDelete?: (item: HrAttendance) => void;
}

export function createAttendanceColumns({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: AttendanceColumnsProps): ColumnDef<HrAttendance>[] {
  return [
    {
      accessorKey: "userId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User ID" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("userId")}</span>
      ),
      size: 180,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("date")).toLocaleDateString()}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "clockIn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clock In" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("clockIn") || "-"}</span>
      ),
      size: 100,
    },
    {
      accessorKey: "clockOut",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clock Out" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("clockOut") || "-"}</span>
      ),
      size: 100,
    },
    {
      accessorKey: "totalHours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Hours" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("totalHours")}h</span>
      ),
      size: 110,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof HrAttendanceStatusLabels;
        return (
          <Badge className={HrAttendanceStatusColors[status]}>
            {HrAttendanceStatusLabels[status] || status}
          </Badge>
        );
      },
      size: 120,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
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
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && canPerformAction(ActionType.DELETE) && (
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
      size: 60,
      maxSize: 60,
    },
  ];
}
