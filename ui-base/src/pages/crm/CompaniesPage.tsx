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
import { Building2, Upload } from "lucide-react";
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
import CompanyModal from "@/components/crm/CompanyModal";
import CsvImportDialog from "@/components/crm/CsvImportDialog";
import { crmService } from "@/api/crmService";
import type { CrmCompany } from "@/api/crmTypes";
import {
  CompanyStatus,
  CompanyStatusLabels,
  CompanySize,
  CompanySizeLabels,
} from "@/api/crmTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createCompanyColumns } from "./columns";

export default function CompaniesPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.CRM_COMPANY).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(() => moduleActions.includes(ActionType.DELETE), [moduleActions]);

  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Modal & delete state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CrmCompany | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CrmCompany | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, sizeFilter]);

  // Fetch companies
  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await crmService.getCompanies({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          size: sizeFilter !== "all" ? sizeFilter : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setCompanies(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setCompanies([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setCompanies([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load companies");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCompanies();
    return () => { cancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, sizeFilter]);

  const refreshCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmService.getCompanies({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        size: sizeFilter !== "all" ? sizeFilter : undefined,
      });

      if (response.success && response.data) {
        setCompanies(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setCompanies([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh companies");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, sizeFilter]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((company: CrmCompany) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((company: CrmCompany) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((company: CrmCompany) => {
    setCompanyToDelete(company);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!companyToDelete) return;
    try {
      const response = await crmService.deleteCompany(companyToDelete.id);
      if (response.success) {
        toast.success("Company deleted successfully");
        refreshCompanies();
      } else {
        toast.error(response.message || "Failed to delete company");
      }
    } catch {
      toast.error("Error deleting company");
    } finally {
      setIsDeleteOpen(false);
      setCompanyToDelete(null);
    }
  }, [companyToDelete, refreshCompanies]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setCompanyToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleSizeFilterChange = useCallback((value: string) => {
    setSizeFilter(value);
  }, []);

  const columns = useMemo(
    () =>
      createCompanyColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  const table = useReactTable({
    data: companies,
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

  const hasActiveFilters =
    debouncedSearchTerm || statusFilter !== "all" || sizeFilter !== "all";

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Statuses</SelectItem>
                  {Object.entries(CompanyStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sizeFilter} onValueChange={handleSizeFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Sizes</SelectItem>
                  {Object.entries(CompanySizeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
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
            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <Building2 className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading companies...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Companies Found" : "No Companies Yet"}
            description={
              hasActiveFilters
                ? "No companies match your current filters. Try adjusting your search or filters."
                : "Get started by adding your first company."
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

      {/* Company Modal */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        company={selectedCompany}
        onSaved={handleModalSaved}
      />

      {/* Delete Confirmation */}
      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={companyToDelete?.name}
          itemType="company"
        />
      )}
      <CsvImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshCompanies}
        type="companies"
      />
    </div>
  );
}
