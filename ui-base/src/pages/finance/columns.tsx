import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileOutput,
  Download,
  Mail,
  Ban,
} from "lucide-react";
import type {
  FinInvoice,
  FinEstimate,
  FinProduct,
  FinExpense,
  FinVendor,
} from "@/api/financeTypes";
import {
  InvoiceStatusLabels,
  InvoiceStatusColors,
  EstimateStatusLabels,
  EstimateStatusColors,
  EstimateStatus,
  ProductTypeLabels,
  ProductTypeColors,
  PaymentMethodLabels,
  formatCurrency,
} from "@/api/financeTypes";

// ─── Invoice Columns ──────────────────────────────────────

interface InvoiceColumnOptions {
  onView: (invoice: FinInvoice) => void;
  onEdit: (invoice: FinInvoice) => void;
  onDelete?: (invoice: FinInvoice) => void;
  onDownloadPdf?: (invoice: FinInvoice) => void;
  onEmail?: (invoice: FinInvoice) => void;
  onCancel?: (invoice: FinInvoice) => void;
}

export function createInvoiceColumns({
  onView,
  onEdit,
  onDelete,
  onDownloadPdf,
  onEmail,
  onCancel,
}: InvoiceColumnOptions): ColumnDef<FinInvoice>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("invoiceNumber")}</span>
      ),
      size: 130,
      minSize: 100,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const name =
          row.getValue("customerName") ||
          row.original.crmCompany?.name;
        return (
          <span className="text-sm">{(name as string) || "-"}</span>
        );
      },
      size: 180,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof InvoiceStatusLabels;
        return (
          <Badge className={InvoiceStatusColors[status]}>
            {InvoiceStatusLabels[status]}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("issueDate")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("dueDate")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue("total"), row.original.currency)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "amountDue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount Due" />
      ),
      cell: ({ row }) => {
        const due = row.getValue("amountDue") as number;
        return (
          <span className={`font-medium ${due > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(due, row.original.currency)}
          </span>
        );
      },
      size: 120,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(invoice)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(invoice)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDownloadPdf && (
                <DropdownMenuItem onClick={() => onDownloadPdf(invoice)} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
              )}
              {onEmail && (
                <DropdownMenuItem onClick={() => onEmail(invoice)} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
              )}
              {onCancel && invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
                <DropdownMenuItem onClick={() => onCancel(invoice)} className="text-amber-600 cursor-pointer">
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(invoice)}
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

// ─── Estimate Columns ──────────────────────────────────────

interface EstimateColumnOptions {
  onView: (estimate: FinEstimate) => void;
  onEdit: (estimate: FinEstimate) => void;
  onDelete?: (estimate: FinEstimate) => void;
  onConvert?: (estimate: FinEstimate) => void;
  onDownloadPdf?: (estimate: FinEstimate) => void;
  onEmail?: (estimate: FinEstimate) => void;
}

export function createEstimateColumns({
  onView,
  onEdit,
  onDelete,
  onConvert,
  onDownloadPdf,
  onEmail,
}: EstimateColumnOptions): ColumnDef<FinEstimate>[] {
  return [
    {
      accessorKey: "estimateNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estimate #" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("estimateNumber")}</span>
      ),
      size: 130,
      minSize: 100,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const name =
          row.getValue("customerName") ||
          row.original.crmCompany?.name;
        return (
          <span className="text-sm">{(name as string) || "-"}</span>
        );
      },
      size: 180,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof EstimateStatusLabels;
        return (
          <Badge className={EstimateStatusColors[status]}>
            {EstimateStatusLabels[status]}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("issueDate")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: "validUntil",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valid Until" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("validUntil") as string | undefined;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm">
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
      size: 110,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue("total"), row.original.currency)}
        </span>
      ),
      size: 120,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const estimate = row.original;
        const canConvert =
          estimate.status !== EstimateStatus.CONVERTED &&
          estimate.status !== EstimateStatus.REJECTED &&
          estimate.status !== EstimateStatus.EXPIRED;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(estimate)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(estimate)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onConvert && canConvert && (
                <DropdownMenuItem onClick={() => onConvert(estimate)} className="cursor-pointer">
                  <FileOutput className="mr-2 h-4 w-4" />
                  Convert to Invoice
                </DropdownMenuItem>
              )}
              {onDownloadPdf && (
                <DropdownMenuItem onClick={() => onDownloadPdf(estimate)} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
              )}
              {onEmail && (
                <DropdownMenuItem onClick={() => onEmail(estimate)} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(estimate)}
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

// ─── Product Columns ──────────────────────────────────────

interface ProductColumnOptions {
  onView: (product: FinProduct) => void;
  onEdit: (product: FinProduct) => void;
  onDelete?: (product: FinProduct) => void;
}

export function createProductColumns({
  onView,
  onEdit,
  onDelete,
}: ProductColumnOptions): ColumnDef<FinProduct>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as keyof typeof ProductTypeLabels;
        return (
          <Badge className={ProductTypeColors[type]}>
            {ProductTypeLabels[type]}
          </Badge>
        );
      },
      size: 110,
    },
    {
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue("unitPrice"))}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "unit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("unit") || "-"}</span>
      ),
      size: 100,
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="SKU" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("sku") || "-"}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const active = row.getValue("isActive") as boolean;
        return (
          <Badge
            className={
              active
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(product)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(product)}
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

// ─── Expense Columns ──────────────────────────────────────

interface ExpenseColumnOptions {
  onView: (expense: FinExpense) => void;
  onEdit: (expense: FinExpense) => void;
  onDelete?: (expense: FinExpense) => void;
}

export function createExpenseColumns({
  onView,
  onEdit,
  onDelete,
}: ExpenseColumnOptions): ColumnDef<FinExpense>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "expenseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("expenseDate")).toLocaleDateString()}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("description") || "-"}
        </span>
      ),
      size: 200,
      minSize: 150,
    },
    {
      id: "categoryName",
      accessorFn: (row) => row.category?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("categoryName") || "-"}
        </span>
      ),
      size: 140,
    },
    {
      id: "vendorName",
      accessorFn: (row) => row.vendor?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue("vendorName") || "-"}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue("amount"), row.original.currency)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Method" />
      ),
      cell: ({ row }) => {
        const method = row.getValue("paymentMethod") as keyof typeof PaymentMethodLabels | undefined;
        if (!method) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="outline">{PaymentMethodLabels[method]}</Badge>;
      },
      size: 140,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(expense)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(expense)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense)}
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

// ─── Vendor Columns ──────────────────────────────────────

interface VendorColumnOptions {
  onView: (vendor: FinVendor) => void;
  onEdit: (vendor: FinVendor) => void;
  onDelete?: (vendor: FinVendor) => void;
}

export function createVendorColumns({
  onView,
  onEdit,
  onDelete,
}: VendorColumnOptions): ColumnDef<FinVendor>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
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
      accessorKey: "city",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("city") || "-"}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("country") || "-"}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const active = row.getValue("isActive") as boolean;
        return (
          <Badge
            className={
              active
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(vendor)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(vendor)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(vendor)}
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
