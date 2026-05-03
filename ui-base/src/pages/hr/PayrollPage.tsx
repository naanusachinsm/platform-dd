import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
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
import { hrService } from "@/api/hrService";
import type { HrPayroll } from "@/api/hrTypes";
import { HrPayrollStatus } from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ModuleName, ActionType } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createPayrollColumns } from "./payrollColumns";
import PayrollModal from "./PayrollModal";

export default function PayrollPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.HR_PAYROLL).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canPerformAction = useMemo(
    () => (action: ActionType) => moduleActions.includes(action),
    [moduleActions]
  );

  const [items, setItems] = useState<HrPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HrPayroll | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HrPayroll | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, yearFilter]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await hrService.getPayrollRecords({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm || undefined,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? (statusFilter as HrPayrollStatus) : undefined,
          year: yearFilter ? parseInt(yearFilter, 10) : undefined,
        });
        if (!cancelled && res.success && res.data) {
          setItems(res.data.data);
          setTotalItems(res.data.total);
        } else if (!cancelled) {
          setItems([]);
          setTotalItems(0);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotalItems(0);
          toast.error("Failed to load payroll");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, yearFilter]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrService.getPayrollRecords({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as HrPayrollStatus) : undefined,
        year: yearFilter ? parseInt(yearFilter, 10) : undefined,
      });
      if (res.success && res.data) {
        setItems(res.data.data);
        setTotalItems(res.data.total);
      }
    } catch {
      toast.error("Failed to refresh payroll");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, yearFilter]);

  const handleAdd = () => {
    setSelectedItem(null);
    setModalMode("create");
    setIsModalOpen(true);
  };
  const handleView = (item: HrPayroll) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };
  const handleEdit = (item: HrPayroll) => {
    setSelectedItem(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };
  const handleDeleteClick = (item: HrPayroll) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await hrService.deletePayroll(itemToDelete.id);
      if (res.success) {
        toast.success("Payroll deleted successfully");
        refresh();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting payroll");
    } finally {
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = useMemo(
    () =>
      createPayrollColumns({
        canPerformAction,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canPerformAction(ActionType.DELETE) ? handleDeleteClick : undefined,
      }),
    [canPerformAction]
  );

  const table = useReactTable({
    data: items,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: Math.ceil(totalItems / pageSize) || 1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      if (next.pageSize !== pageSize) setCurrentPage(1);
      else setCurrentPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const hasActiveFilters = !!debouncedSearchTerm || statusFilter !== "all" || !!yearFilter;

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Input
              placeholder="Search payroll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] cursor-pointer">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={HrPayrollStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={HrPayrollStatus.PROCESSED}>Processed</SelectItem>
                <SelectItem value={HrPayrollStatus.PAID}>Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter || "all"} onValueChange={(v) => setYearFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px] cursor-pointer">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canPerformAction(ActionType.CREATE) && (
            <Button onClick={handleAdd} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Payroll
            </Button>
          )}
        </div>

        {loading ? (
          <div className="rounded-md border p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading payroll...</p>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Payroll Found" : "No Payroll Yet"}
            description={
              hasActiveFilters
                ? "No payroll records match your filters."
                : "Get started by adding your first payroll record."
            }
            onAction={canPerformAction(ActionType.CREATE) ? handleAdd : undefined}
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

      <PayrollModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={refresh}
        payroll={selectedItem}
        mode={modalMode}
      />

      {canPerformAction(ActionType.DELETE) && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsDeleteOpen(false);
            setItemToDelete(null);
          }}
          itemName={itemToDelete ? `${itemToDelete.userId} - ${itemToDelete.month}/${itemToDelete.year}` : undefined}
          itemType="payroll record"
        />
      )}
    </div>
  );
}
