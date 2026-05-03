import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActionType } from "@/api/roleTypes";
import type { HrDocument } from "@/api/hrTypes";
import {
  HrDocumentTypeLabels,
  HrDocumentStatusLabels,
  HrDocumentStatusColors,
} from "@/api/hrTypes";
import { DataTableColumnHeader } from "@/components/common/DataTable";

interface DocumentColumnsProps {
  canPerformAction: (action: ActionType) => boolean;
  onView: (document: HrDocument) => void;
  onEdit: (document: HrDocument) => void;
  onDelete: (document: HrDocument) => void;
  isAdmin?: boolean;
}

export const createDocumentColumns = ({
  canPerformAction,
  onView,
  onEdit,
  onDelete,
  isAdmin = false,
}: DocumentColumnsProps): ColumnDef<HrDocument>[] => [
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
    accessorKey: "documentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("documentType") as keyof typeof HrDocumentTypeLabels;
      return (
        <Badge variant="outline">
          {HrDocumentTypeLabels[type] || type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "fileName",
    header: "File Name",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
        {row.original.fileName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "isPublic",
    header: "Visibility",
    cell: ({ row }) => {
      const isPublic = row.getValue("isPublic") as boolean;
      return isPublic ? (
        <div className="flex items-center gap-1 text-green-600">
          <Globe className="h-3.5 w-3.5" />
          <span className="text-sm">Public</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-sm">Private</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof HrDocumentStatusLabels;
      return (
        <Badge className={HrDocumentStatusColors[status]}>
          {HrDocumentStatusLabels[status] || status}
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
            {isAdmin && canPerformAction(ActionType.DELETE) && (
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
