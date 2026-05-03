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
import { ClipboardList } from "lucide-react";
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
import type { FinEstimate } from "@/api/financeTypes";
import { EstimateStatusLabels, FINANCE_CURRENCIES } from "@/api/financeTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createEstimateColumns } from "./columns";
import EstimateModal from "@/components/finance/EstimateModal";
import EmailDocumentDialog from "@/components/finance/EmailDocumentDialog";

export default function EstimatesPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.FIN_ESTIMATE).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(
    () => moduleActions.includes(ActionType.DELETE),
    [moduleActions]
  );

  const [estimates, setEstimates] = useState<FinEstimate[]>([]);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEstimate, setSelectedEstimate] = useState<FinEstimate | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [emailEstimate, setEmailEstimate] = useState<FinEstimate | null>(null);
  const [estimateToDelete, setEstimateToDelete] = useState<FinEstimate | null>(null);

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

    const fetchEstimates = async () => {
      try {
        setLoading(true);
        const response = await financeService.getEstimates({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          currency: financeCurrency !== "all" ? financeCurrency : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setEstimates(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setEstimates([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setEstimates([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load estimates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEstimates();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, financeCurrency]);

  const refreshEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeService.getEstimates({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        currency: financeCurrency !== "all" ? financeCurrency : undefined,
      });

      if (response.success && response.data) {
        setEstimates(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setEstimates([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh estimates");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, financeCurrency]);

  const handleAdd = useCallback(() => {
    setSelectedEstimate(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((estimate: FinEstimate) => {
    setSelectedEstimate(estimate);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((estimate: FinEstimate) => {
    setSelectedEstimate(estimate);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((estimate: FinEstimate) => {
    setEstimateToDelete(estimate);
    setIsDeleteOpen(true);
  }, []);

  const handleConvert = useCallback(
    async (estimate: FinEstimate) => {
      try {
        const response = await financeService.convertEstimateToInvoice(estimate.id);
        if (response.success) {
          toast.success("Estimate converted to invoice successfully");
          refreshEstimates();
        } else {
          toast.error(response.message || "Failed to convert estimate");
        }
      } catch {
        toast.error("Error converting estimate to invoice");
      }
    },
    [refreshEstimates]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!estimateToDelete) return;
    try {
      const response = await financeService.deleteEstimate(estimateToDelete.id);
      if (response.success) {
        toast.success("Estimate deleted successfully");
        refreshEstimates();
      } else {
        toast.error(response.message || "Failed to delete estimate");
      }
    } catch {
      toast.error("Error deleting estimate");
    } finally {
      setIsDeleteOpen(false);
      setEstimateToDelete(null);
    }
  }, [estimateToDelete, refreshEstimates]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setEstimateToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEstimate(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshEstimates();
  }, [refreshEstimates]);

  const handleDownloadPdf = useCallback(async (estimate: FinEstimate) => {
    try {
      await financeService.downloadEstimatePdf(estimate.id, `${estimate.estimateNumber}.pdf`);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  }, []);

  const columns = useMemo(
    () =>
      createEstimateColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
        onConvert: handleConvert,
        onDownloadPdf: handleDownloadPdf,
        onEmail: (est) => setEmailEstimate(est),
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete, handleConvert, handleDownloadPdf]
  );

  const table = useReactTable({
    data: estimates,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
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
                placeholder="Search estimates..."
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
                  {Object.entries(EstimateStatusLabels).map(([value, label]) => (
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
            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <ClipboardList className="mr-2 h-4 w-4" />
              New Estimate
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading estimates...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Estimates Found" : "No Estimates Yet"}
            description={
              hasActiveFilters
                ? "No estimates match your current filters. Try adjusting your search or filters."
                : "Get started by creating your first estimate."
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

      <EstimateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        estimate={selectedEstimate}
        mode={modalMode}
      />

      {emailEstimate && (
        <EmailDocumentDialog
          isOpen={!!emailEstimate}
          onClose={() => setEmailEstimate(null)}
          type="estimate"
          documentId={emailEstimate.id}
          documentNumber={emailEstimate.estimateNumber}
          defaultEmail={emailEstimate.customerEmail}
          customerName={emailEstimate.customerName || emailEstimate.crmCompany?.name}
          total={emailEstimate.total}
          currency={emailEstimate.currency}
        />
      )}

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={estimateToDelete?.estimateNumber}
          itemType="estimate"
        />
      )}
    </div>
  );
}
