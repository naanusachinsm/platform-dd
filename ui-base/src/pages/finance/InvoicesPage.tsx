import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, DataTablePagination } from "@/components/common/DataTable";
import { NoDataState } from "@/components/common/NoDataState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { financeService } from "@/api/financeService";
import type { FinInvoice } from "@/api/financeTypes";
import { InvoiceStatus, InvoiceStatusLabels, FINANCE_CURRENCIES } from "@/api/financeTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createInvoiceColumns } from "./columns";
import InvoiceModal from "@/components/finance/InvoiceModal";
import EmailDocumentDialog from "@/components/finance/EmailDocumentDialog";

export default function InvoicesPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.FIN_INVOICE).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(
    () => moduleActions.includes(ActionType.DELETE),
    [moduleActions]
  );

  const [invoices, setInvoices] = useState<FinInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const financeCurrency = useAppStore((s) => s.financeCurrency);
  const setFinanceCurrency = useAppStore((s) => s.setFinanceCurrency);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedData, setSelectedData] = useState<Map<string, FinInvoice>>(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedInvoice, setSelectedInvoice] = useState<FinInvoice | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<FinInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<FinInvoice | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, financeCurrency]);

  useEffect(() => {
    let cancelled = false;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await financeService.getInvoices({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          currency: financeCurrency !== "all" ? financeCurrency : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setInvoices(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setInvoices([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setInvoices([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load invoices");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, financeCurrency]);

  const refreshInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeService.getInvoices({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        currency: financeCurrency !== "all" ? financeCurrency : undefined,
      });

      if (response.success && response.data) {
        setInvoices(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setInvoices([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh invoices");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, financeCurrency]);

  const handleAdd = useCallback(() => {
    setSelectedInvoice(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((invoice: FinInvoice) => {
    setSelectedInvoice(invoice);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((invoice: FinInvoice) => {
    setSelectedInvoice(invoice);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((invoice: FinInvoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!invoiceToDelete) return;
    try {
      const response = await financeService.deleteInvoice(invoiceToDelete.id);
      if (response.success) {
        toast.success("Invoice deleted successfully");
        refreshInvoices();
      } else {
        toast.error(response.message || "Failed to delete invoice");
      }
    } catch {
      toast.error("Error deleting invoice");
    } finally {
      setIsDeleteOpen(false);
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, refreshInvoices]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setInvoiceToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const handleDownloadPdf = useCallback(async (invoice: FinInvoice) => {
    try {
      await financeService.downloadInvoicePdf(invoice.id, `${invoice.invoiceNumber}.pdf`);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  }, []);

  const columns = useMemo(
    () =>
      createInvoiceColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
        onDownloadPdf: handleDownloadPdf,
        onEmail: (inv) => setEmailInvoice(inv),
        onCancel: async (inv) => {
          try {
            const res = await financeService.cancelInvoice(inv.id);
            if (res.success) { toast.success("Invoice cancelled"); refreshInvoices(); }
            else toast.error(res.message || "Failed");
          } catch { toast.error("Error cancelling invoice"); }
        },
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete, handleDownloadPdf, refreshInvoices]
  );

  useEffect(() => {
    if (invoices.length > 0) {
      const restored: RowSelectionState = {};
      invoices.forEach((inv) => { if (selectedIds.has(inv.id)) restored[inv.id] = true; });
      setRowSelection(restored);
    }
  }, [invoices]);

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSelectedIds((ids) => { const n = new Set(ids); invoices.forEach((inv) => { if (next[inv.id]) n.add(inv.id); else n.delete(inv.id); }); return n; });
      setSelectedData((data) => { const n = new Map(data); invoices.forEach((inv) => { if (next[inv.id]) n.set(inv.id, inv); else n.delete(inv.id); }); return n; });
      return next;
    });
  }, [invoices]);

  const table = useReactTable({
    data: invoices,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: true,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;

      if (next.pageSize !== pageSize) {
        setCurrentPage(1);
      } else {
        setCurrentPage(next.pageIndex + 1);
      }
      setPageSize(next.pageSize);
    },
  });

  const hasActiveFilters = debouncedSearchTerm || statusFilter !== "all" || financeCurrency !== "all";

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Statuses
                  </SelectItem>
                  {Object.entries(InvoiceStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={financeCurrency} onValueChange={setFinanceCurrency}>
                <SelectTrigger className="w-full sm:w-[130px] cursor-pointer">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Currencies
                  </SelectItem>
                  {FINANCE_CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="cursor-pointer">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            {selectedIds.size > 0 && <Button
              variant="outline"
              onClick={() => {
                const rows = Array.from(selectedData.values());
                const headers = ["Invoice #", "Customer", "Status", "Issue Date", "Due Date", "Subtotal", "Tax", "Discount", "Total", "Paid", "Due", "Currency"];
                const csv = [headers.join(","), ...rows.map((inv) => [inv.invoiceNumber, inv.customerName || "", inv.status, inv.issueDate, inv.dueDate, inv.subtotal, inv.taxTotal, inv.discountAmount, inv.total, inv.amountPaid, inv.amountDue, inv.currency].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "invoices-export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`${rows.length} invoices exported`);
                setSelectedIds(new Set());
                setSelectedData(new Map());
                setRowSelection({});
              }}
              className="cursor-pointer w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedIds.size})
            </Button>}
            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading invoices...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Invoices Found" : "No Invoices Yet"}
            description={
              hasActiveFilters
                ? "No invoices match your current filters. Try adjusting your search or filters."
                : "Get started by creating your first invoice."
            }
          />
        ) : (
          <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 220px)" }}>
            <div className="overflow-auto flex-1">
              <DataTable columns={columns} table={table} />
            </div>
            <div className="mt-4 flex-shrink-0">
              <DataTablePagination table={table} totalCount={totalItems} />
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        invoice={selectedInvoice}
        mode={modalMode}
      />

      {emailInvoice && (
        <EmailDocumentDialog
          isOpen={!!emailInvoice}
          onClose={() => setEmailInvoice(null)}
          type="invoice"
          documentId={emailInvoice.id}
          documentNumber={emailInvoice.invoiceNumber}
          defaultEmail={emailInvoice.customerEmail}
          customerName={emailInvoice.customerName || emailInvoice.crmCompany?.name}
          total={emailInvoice.total}
          currency={emailInvoice.currency}
          dueDate={emailInvoice.dueDate}
        />
      )}

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={invoiceToDelete?.invoiceNumber}
          itemType="invoice"
        />
      )}
    </div>
  );
}
