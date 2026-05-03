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
import { Store, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, DataTablePagination } from "@/components/common/DataTable";
import { NoDataState } from "@/components/common/NoDataState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { financeService } from "@/api/financeService";
import type { FinVendor } from "@/api/financeTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createVendorColumns } from "./columns";
import VendorModal from "@/components/finance/VendorModal";
import FinanceCsvImportDialog from "@/components/finance/FinanceCsvImportDialog";

export default function VendorsPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.FIN_VENDOR).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(
    () => moduleActions.includes(ActionType.DELETE),
    [moduleActions]
  );

  const [vendors, setVendors] = useState<FinVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedData, setSelectedData] = useState<Map<string, FinVendor>>(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedVendor, setSelectedVendor] = useState<FinVendor | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<FinVendor | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    let cancelled = false;

    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await financeService.getVendors({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setVendors(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setVendors([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setVendors([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load vendors");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVendors();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const refreshVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeService.getVendors({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
      });

      if (response.success && response.data) {
        setVendors(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setVendors([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh vendors");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const handleAdd = useCallback(() => {
    setSelectedVendor(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((vendor: FinVendor) => {
    setSelectedVendor(vendor);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((vendor: FinVendor) => {
    setSelectedVendor(vendor);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((vendor: FinVendor) => {
    setVendorToDelete(vendor);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!vendorToDelete) return;
    try {
      const response = await financeService.deleteVendor(vendorToDelete.id);
      if (response.success) {
        toast.success("Vendor deleted successfully");
        refreshVendors();
      } else {
        toast.error(response.message || "Failed to delete vendor");
      }
    } catch {
      toast.error("Error deleting vendor");
    } finally {
      setIsDeleteOpen(false);
      setVendorToDelete(null);
    }
  }, [vendorToDelete, refreshVendors]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setVendorToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVendor(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshVendors();
  }, [refreshVendors]);

  const columns = useMemo(
    () =>
      createVendorColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  useEffect(() => {
    if (vendors.length > 0) {
      const restored: RowSelectionState = {};
      vendors.forEach((v) => { if (selectedIds.has(v.id)) restored[v.id] = true; });
      setRowSelection(restored);
    }
  }, [vendors]);

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSelectedIds((ids) => { const n = new Set(ids); vendors.forEach((v) => { if (next[v.id]) n.add(v.id); else n.delete(v.id); }); return n; });
      setSelectedData((data) => { const n = new Map(data); vendors.forEach((v) => { if (next[v.id]) n.set(v.id, v); else n.delete(v.id); }); return n; });
      return next;
    });
  }, [vendors]);

  const table = useReactTable({
    data: vendors,
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

  const hasActiveFilters = !!debouncedSearchTerm;

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
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
                const headers = ["Name", "Email", "Phone", "Address", "City", "State", "Country", "Postal Code", "Website", "Active"];
                const csv = [headers.join(","), ...rows.map((v) => [v.name, v.email || "", v.phone || "", v.address || "", v.city || "", v.state || "", v.country || "", v.postalCode || "", v.website || "", v.isActive ? "Yes" : "No"].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "vendors-export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`${rows.length} vendors exported`);
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
              <Store className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading vendors...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Vendors Found" : "No Vendors Yet"}
            description={
              hasActiveFilters
                ? "No vendors match your current search. Try adjusting your search term."
                : "Get started by adding your first vendor."
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

      <VendorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        vendor={selectedVendor}
        mode={modalMode}
      />

      <FinanceCsvImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshVendors}
        type="vendors"
      />

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={vendorToDelete?.name}
          itemType="vendor"
        />
      )}
    </div>
  );
}
