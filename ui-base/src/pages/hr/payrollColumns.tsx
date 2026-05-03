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
import type { HrPayroll } from "@/api/hrTypes";
import { HrPayrollStatusLabels, HrPayrollStatusColors } from "@/api/hrTypes";
import { ActionType } from "@/api/roleTypes";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface PayrollColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (item: HrPayroll) => void;
  onEdit: (item: HrPayroll) => void;
  onDelete?: (item: HrPayroll) => void;
}

export function createPayrollColumns({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
}: PayrollColumnsProps): ColumnDef<HrPayroll>[] {
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
      accessorKey: "month",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Month" />
      ),
      cell: ({ row }) => {
        const month = row.getValue("month") as number;
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        return (
          <span className="text-sm">{monthNames[month - 1] || month}</span>
        );
      },
      size: 100,
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Year" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("year")}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "basicSalary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Basic Salary" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.getValue("basicSalary"))}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "grossSalary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gross Salary" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.getValue("grossSalary"))}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "netSalary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Net Salary" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.getValue("netSalary"))}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof HrPayrollStatusLabels;
        return (
          <Badge className={HrPayrollStatusColors[status]}>
            {HrPayrollStatusLabels[status] || status}
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
