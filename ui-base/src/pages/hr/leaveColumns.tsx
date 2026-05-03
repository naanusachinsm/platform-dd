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
import type { HrLeaveType, HrLeaveRequest } from "@/api/hrTypes";
import {
  HrLeaveTypeStatusLabels,
  HrLeaveTypeStatusColors,
  HrLeaveRequestStatusLabels,
  HrLeaveRequestStatusColors,
} from "@/api/hrTypes";
import { ActionType } from "@/api/roleTypes";

interface LeaveTypeColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (item: HrLeaveType) => void;
  onEdit: (item: HrLeaveType) => void;
  onDelete?: (item: HrLeaveType) => void;
}

export function createLeaveTypeColumns({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: LeaveTypeColumnsProps): ColumnDef<HrLeaveType>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      size: 180,
      minSize: 140,
    },
    {
      accessorKey: "defaultDays",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Default Days" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("defaultDays")}</span>
      ),
      size: 120,
    },
    {
      accessorKey: "carryForward",
      header: "Carry Forward",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("carryForward") ? "Yes" : "No"}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "isPaid",
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("isPaid") ? "Yes" : "No"}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof HrLeaveTypeStatusLabels;
        return (
          <Badge className={HrLeaveTypeStatusColors[status]}>
            {HrLeaveTypeStatusLabels[status] || status}
          </Badge>
        );
      },
      size: 110,
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
              {canPerformAction(ActionType.DELETE) && onDelete && item.organizationId && (
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

interface LeaveRequestColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (item: HrLeaveRequest) => void;
  onEdit: (item: HrLeaveRequest) => void;
  onDelete?: (item: HrLeaveRequest) => void;
  leaveTypeMap?: Map<string, string>;
  userMap?: Map<string, string>;
  isAdmin?: boolean;
}

export function createLeaveRequestColumns({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
  leaveTypeMap = new Map(),
  userMap = new Map(),
  isAdmin = false,
}: LeaveRequestColumnsProps): ColumnDef<HrLeaveRequest>[] {
  return [
    ...(isAdmin
      ? [
          {
            accessorKey: "userId",
            header: ({ column }: any) => (
              <DataTableColumnHeader column={column} title="User" />
            ),
            cell: ({ row }: any) => {
              const userId = row.getValue("userId") as string;
              return (
                <span className="text-sm font-medium">
                  {userMap.get(userId) || userId}
                </span>
              );
            },
            size: 180,
          } as ColumnDef<HrLeaveRequest>,
        ]
      : []),
    {
      accessorKey: "leaveTypeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leave Type" />
      ),
      cell: ({ row }) => {
        const id = row.getValue("leaveTypeId") as string;
        return (
          <span className="text-sm font-medium">
            {leaveTypeMap.get(id) || id}
          </span>
        );
      },
      size: 180,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("startDate")).toLocaleDateString()}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("endDate")).toLocaleDateString()}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "daysCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Days" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("daysCount")}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof HrLeaveRequestStatusLabels;
        return (
          <Badge className={HrLeaveRequestStatusColors[status]}>
            {HrLeaveRequestStatusLabels[status] || status}
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
              {canPerformAction(ActionType.DELETE) && onDelete && (
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
