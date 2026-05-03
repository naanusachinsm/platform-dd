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
import type { CrmCompany, CrmContact, CrmDeal } from "@/api/crmTypes";
import {
  CompanySizeLabels,
  CompanyStatusLabels,
  ContactStatusLabels,
  ContactSourceLabels,
  DealStageLabels,
  DealStageColors,
  DealPriorityLabels,
  formatCrmCurrency,
} from "@/api/crmTypes";

// ─── Company Columns ──────────────────────────────────────

interface CompanyColumnOptions {
  onView: (company: CrmCompany) => void;
  onEdit: (company: CrmCompany) => void;
  onDelete?: (company: CrmCompany) => void;
}

export function createCompanyColumns({
  onView,
  onEdit,
  onDelete,
}: CompanyColumnOptions): ColumnDef<CrmCompany>[] {
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
      accessorKey: "industry",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Industry" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("industry") || "-"}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => {
        const size = row.getValue("size") as keyof typeof CompanySizeLabels | undefined;
        if (!size) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="outline">{CompanySizeLabels[size]}</Badge>;
      },
      size: 110,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("email") || "-"}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("phone") || "-"}</span>
      ),
      size: 140,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof CompanyStatusLabels;
        const color =
          status === "ACTIVE"
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return <Badge className={color}>{CompanyStatusLabels[status]}</Badge>;
      },
      size: 100,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const company = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(company)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(company)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(company)}
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

// ─── Contact Columns ──────────────────────────────────────

interface ContactColumnOptions {
  onView: (contact: CrmContact) => void;
  onEdit: (contact: CrmContact) => void;
  onDelete?: (contact: CrmContact) => void;
}

export function createContactColumns({
  onView,
  onEdit,
  onDelete,
}: ContactColumnOptions): ColumnDef<CrmContact>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
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
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("email") || "-"}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("phone") || "-"}</span>
      ),
      size: 140,
    },
    {
      id: "companyName",
      accessorFn: (row) => row.company?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("companyName") || "-"}
        </span>
      ),
      size: 160,
    },
    {
      accessorKey: "jobTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Job Title" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("jobTitle") || "-"}</span>
      ),
      size: 150,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof ContactStatusLabels;
        return (
          <Badge variant="outline">{ContactStatusLabels[status]}</Badge>
        );
      },
      size: 100,
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      cell: ({ row }) => {
        const source = row.getValue("source") as keyof typeof ContactSourceLabels | undefined;
        if (!source) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="secondary">{ContactSourceLabels[source]}</Badge>;
      },
      size: 120,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(contact)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(contact)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(contact)}
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

// ─── Deal Columns ──────────────────────────────────────

interface DealColumnOptions {
  onView: (deal: CrmDeal) => void;
  onEdit: (deal: CrmDeal) => void;
  onDelete?: (deal: CrmDeal) => void;
}

export function createDealColumns({
  onView,
  onEdit,
  onDelete,
}: DealColumnOptions): ColumnDef<CrmDeal>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("title")}</span>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("value") as number;
        return (
          <span className="font-medium">
            {formatCrmCurrency(value)}
          </span>
        );
      },
      size: 130,
    },
    {
      id: "companyName",
      accessorFn: (row) => row.company?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("companyName") || "-"}
        </span>
      ),
      size: 160,
    },
    {
      id: "contactName",
      accessorFn: (row) =>
        row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : null,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("contactName") || "-"}
        </span>
      ),
      size: 160,
    },
    {
      accessorKey: "stage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
      ),
      cell: ({ row }) => {
        const stage = row.getValue("stage") as keyof typeof DealStageLabels;
        return (
          <Badge className={DealStageColors[stage]}>
            {DealStageLabels[stage]}
          </Badge>
        );
      },
      size: 130,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = row.getValue("priority") as keyof typeof DealPriorityLabels;
        return (
          <Badge variant="outline">{DealPriorityLabels[priority]}</Badge>
        );
      },
      size: 100,
    },
    {
      accessorKey: "expectedCloseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expected Close" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("expectedCloseDate") as string | undefined;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm">
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
      size: 130,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(deal)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(deal)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(deal)}
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
