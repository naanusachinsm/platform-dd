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
import { Receipt, Upload, Download } from "lucide-react";
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
import type { FinExpense, FinExpenseCategory, FinVendor } from "@/api/financeTypes";
import { FINANCE_CURRENCIES } from "@/api/financeTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createExpenseColumns } from "./columns";
import ExpenseModal from "@/components/finance/ExpenseModal";
import FinanceCsvImportDialog from "@/components/finance/FinanceCsvImportDialog";

export default function ExpensesPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.FIN_EXPENSE).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(
    () => moduleActions.includes(ActionType.DELETE),
    [moduleActions]
  );

  const [expenses, setExpenses] = useState<FinExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const financeCurrency = useAppStore((s) => s.financeCurrency);
  const setFinanceCurrency = useAppStore((s) => s.setFinanceCurrency);

  const [categories, setCategories] = useState<FinExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<FinVendor[]>([]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedData, setSelectedData] = useState<Map<string, FinExpense>>(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedExpense, setSelectedExpense] = useState<FinExpense | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<FinExpense | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, vendorRes] = await Promise.all([
          financeService.getExpenseCategories({ limit: 100 }),
          financeService.getVendors({ limit: 100 }),
        ]);
        if (catRes.success && catRes.data) setCategories(catRes.data.data);
        if (vendorRes.success && vendorRes.data) setVendors(vendorRes.data.data);
      } catch {
        // Silently fail for filter loading
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryFilter, vendorFilter, financeCurrency]);

  useEffect(() => {
    let cancelled = false;

    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await financeService.getExpenses({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
          vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
          currency: financeCurrency !== "all" ? financeCurrency : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setExpenses(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setExpenses([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setExpenses([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load expenses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchExpenses();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, categoryFilter, vendorFilter, financeCurrency]);

  const refreshExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeService.getExpenses({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
        currency: financeCurrency !== "all" ? financeCurrency : undefined,
      });

      if (response.success && response.data) {
        setExpenses(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setExpenses([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh expenses");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, categoryFilter, vendorFilter, financeCurrency]);

  const handleAdd = useCallback(() => {
    setSelectedExpense(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((expense: FinExpense) => {
    setSelectedExpense(expense);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((expense: FinExpense) => {
    setSelectedExpense(expense);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((expense: FinExpense) => {
    setExpenseToDelete(expense);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!expenseToDelete) return;
    try {
      const response = await financeService.deleteExpense(expenseToDelete.id);
      if (response.success) {
        toast.success("Expense deleted successfully");
        refreshExpenses();
      } else {
        toast.error(response.message || "Failed to delete expense");
      }
    } catch {
      toast.error("Error deleting expense");
    } finally {
      setIsDeleteOpen(false);
      setExpenseToDelete(null);
    }
  }, [expenseToDelete, refreshExpenses]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setExpenseToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedExpense(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const columns = useMemo(
    () =>
      createExpenseColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  useEffect(() => {
    if (expenses.length > 0) {
      const restored: RowSelectionState = {};
      expenses.forEach((e) => { if (selectedIds.has(e.id)) restored[e.id] = true; });
      setRowSelection(restored);
    }
  }, [expenses]);

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSelectedIds((ids) => { const n = new Set(ids); expenses.forEach((e) => { if (next[e.id]) n.add(e.id); else n.delete(e.id); }); return n; });
      setSelectedData((data) => { const n = new Map(data); expenses.forEach((e) => { if (next[e.id]) n.set(e.id, e); else n.delete(e.id); }); return n; });
      return next;
    });
  }, [expenses]);

  const table = useReactTable({
    data: expenses,
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

  const hasActiveFilters =
    debouncedSearchTerm || categoryFilter !== "all" || vendorFilter !== "all" || financeCurrency !== "all";

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Categories
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Vendors
                  </SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="cursor-pointer">
                      {v.name}
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
            <Button variant="outline" onClick={() => setImportOpen(true)} className="cursor-pointer w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            {selectedIds.size > 0 && <Button
              variant="outline"
              onClick={() => {
                const rows = Array.from(selectedData.values());
                const headers = ["Date", "Description", "Category", "Vendor", "Amount", "Currency", "Payment Method", "Reference #", "Reimbursable"];
                const csv = [headers.join(","), ...rows.map((e) => [e.expenseDate, e.description || "", e.category?.name || "", e.vendor?.name || "", e.amount, e.currency, e.paymentMethod || "", e.referenceNumber || "", e.isReimbursable ? "Yes" : "No"].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "expenses-export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`${rows.length} expenses exported`);
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
              <Receipt className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading expenses...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Expenses Found" : "No Expenses Yet"}
            description={
              hasActiveFilters
                ? "No expenses match your current filters. Try adjusting your search or filters."
                : "Get started by recording your first expense."
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

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        expense={selectedExpense}
        mode={modalMode}
      />

      <FinanceCsvImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshExpenses}
        type="expenses"
      />

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={expenseToDelete?.description || "this expense"}
          itemType="expense"
        />
      )}
    </div>
  );
}
