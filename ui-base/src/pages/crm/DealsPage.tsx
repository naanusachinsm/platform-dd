import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, LayoutList, Kanban } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DataTable, DataTablePagination } from "@/components/common/DataTable";
import { NoDataState } from "@/components/common/NoDataState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import DealModal from "@/components/crm/DealModal";
import DealKanbanBoard from "@/components/crm/DealKanbanBoard";
import confetti from "canvas-confetti";
import { crmService } from "@/api/crmService";
import { userService } from "@/api/userService";
import type { CrmDeal, CrmContact, CrmCompany, DealPipeline } from "@/api/crmTypes";
import {
  DealStage,
  DealStageLabels,
  DealPriority,
  DealPriorityLabels,
  STAGE_ORDER,
} from "@/api/crmTypes";
import { createDealColumns } from "./columns";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (\u20B9)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
];

type ViewMode = "table" | "kanban";

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

export default function DealsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const user = useAppStore((s) => s.user);
  const crmCurrency = useAppStore((s) => s.crmCurrency);
  const setCrmCurrency = useAppStore((s) => s.setCrmCurrency);
  const [moduleActions, setModuleActions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.CRM_DEAL).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(() => moduleActions.includes(ActionType.DELETE), [moduleActions]);

  // Table data
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(false);

  // Pipeline data (kanban)
  const [pipeline, setPipeline] = useState<DealPipeline>(() => {
    const empty = {} as DealPipeline;
    STAGE_ORDER.forEach((s) => { empty[s] = []; });
    return empty;
  });
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // Dropdown data for DealModal and filters
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  // Pagination (table mode)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Modal & delete state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<CrmDeal | null>(null);

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
  }, [debouncedSearchTerm, stageFilter, priorityFilter, ownerFilter]);

  // Fetch table deals
  useEffect(() => {
    if (viewMode !== "table") return;
    let cancelled = false;

    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await crmService.getDeals({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          stage: stageFilter !== "all" ? stageFilter : undefined,
          priority: priorityFilter !== "all" ? priorityFilter : undefined,
          ownerId: ownerFilter !== "all" ? ownerFilter : undefined,
          dateRange: dateRange !== "all" ? dateRange : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setDeals(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setDeals([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setDeals([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDeals();
    return () => { cancelled = true; };
  }, [viewMode, currentPage, pageSize, debouncedSearchTerm, stageFilter, priorityFilter, ownerFilter, dateRange]);

  // Fetch pipeline data
  const fetchPipeline = useCallback(async () => {
    try {
      setPipelineLoading(true);
      const response = await crmService.getDealsPipeline(dateRange !== "all" ? dateRange : undefined);
      if (response.success && response.data) {
        setPipeline(response.data);
      }
    } catch {
      toast.error("Failed to load pipeline");
    } finally {
      setPipelineLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Fetch contacts and companies for modal dropdowns
  useEffect(() => {
    let cancelled = false;

    const fetchDropdownData = async () => {
      try {
        const [contactsRes, companiesRes, usersRes] = await Promise.all([
          crmService.getContacts({ limit: 200 }),
          crmService.getCompanies({ limit: 200 }),
          userService.getUsers({ limit: 200 }),
        ]);
        if (!cancelled) {
          if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data.data);
          if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data.data);
          if (usersRes.success && usersRes.data) {
            setUsers(usersRes.data.data.map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })));
          }
        }
      } catch {
        // non-critical
      }
    };

    fetchDropdownData();
    return () => { cancelled = true; };
  }, []);

  // Refresh table data
  const refreshDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmService.getDeals({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        stage: stageFilter !== "all" ? stageFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        ownerId: ownerFilter !== "all" ? ownerFilter : undefined,
        dateRange: dateRange !== "all" ? dateRange : undefined,
      });

      if (response.success && response.data) {
        setDeals(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setDeals([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh deals");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, stageFilter, priorityFilter, ownerFilter, dateRange]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedDeal(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((deal: CrmDeal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((deal: CrmDeal) => {
    navigate(`/dashboard/crm/deals/${deal.id}`, { state: { dealTitle: deal.title } });
  }, [navigate]);

  const handleDeleteClick = useCallback((deal: CrmDeal) => {
    setDealToDelete(deal);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!dealToDelete) return;
    try {
      const response = await crmService.deleteDeal(dealToDelete.id);
      if (response.success) {
        toast.success("Deal deleted successfully");
        if (viewMode === "table") refreshDeals();
        else fetchPipeline();
      } else {
        toast.error(response.message || "Failed to delete deal");
      }
    } catch {
      toast.error("Error deleting deal");
    } finally {
      setIsDeleteOpen(false);
      setDealToDelete(null);
    }
  }, [dealToDelete, viewMode, refreshDeals, fetchPipeline]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setDealToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDeal(null);
  }, []);

  const handleModalSaved = useCallback(async () => {
    if (viewMode === "table") {
      await refreshDeals();
    } else {
      await fetchPipeline();
    }
  }, [viewMode, refreshDeals, fetchPipeline]);

  const handleStageChange = useCallback(
    async (dealId: string, stage: DealStage, position: number) => {
      await crmService.updateDealStage(dealId, { stage, position });
      if (stage === DealStage.CLOSED_WON) {
        confetti({ particleCount: 100, spread: 60, angle: 60, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 100, spread: 60, angle: 120, origin: { x: 1, y: 0.6 } });
      }
      await fetchPipeline();
    },
    [fetchPipeline]
  );

  const handleDealClick = useCallback((deal: CrmDeal) => {
    navigate(`/dashboard/crm/deals/${deal.id}`, { state: { dealTitle: deal.title } });
  }, [navigate]);

  const handleStageFilterChange = useCallback((value: string) => {
    setStageFilter(value);
  }, []);

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
  }, []);

  const handleViewModeChange = useCallback((value: string) => {
    if (value) setViewMode(value as ViewMode);
  }, []);

  // Table columns
  const columns = useMemo(
    () =>
      createDealColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  const table = useReactTable({
    data: deals,
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
    debouncedSearchTerm || stageFilter !== "all" || priorityFilter !== "all" || ownerFilter !== "all";

  const isTableLoading = viewMode === "table" && loading;
  const isKanbanLoading = viewMode === "kanban" && pipelineLoading;
  const isPageLoading = isTableLoading || isKanbanLoading;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-64px)] p-4">
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* Toolbar */}
        {!isPageLoading && (
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 shrink-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={stageFilter} onValueChange={handleStageFilterChange}>
                <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Stages</SelectItem>
                  {Object.entries(DealStageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Priorities</SelectItem>
                  {Object.entries(DealPriorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Assignees</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="cursor-pointer capitalize">
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={handleViewModeChange}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="kanban" aria-label="Kanban view" className="cursor-pointer">
                  <Kanban className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view" className="cursor-pointer">
                  <LayoutList className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Select value={crmCurrency} onValueChange={setCrmCurrency}>
                <SelectTrigger className="w-[110px] cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        )}

        {/* Content */}
        {isPageLoading ? (
          <div className="rounded-md border flex-1">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading deals...
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          totalItems === 0 ? (
            <NoDataState
              title={hasActiveFilters ? "No Deals Found" : "No Deals Yet"}
              description={
                hasActiveFilters
                  ? "No deals match your current filters. Try adjusting your search or filters."
                  : "Get started by adding your first deal to the pipeline."
              }
            />
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="overflow-auto flex-1">
                <DataTable columns={columns} table={table} />
              </div>
              <div className="mt-4 flex-shrink-0">
                <DataTablePagination table={table} totalCount={totalItems} />
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 min-h-0 -mx-4 overflow-hidden">
            <DealKanbanBoard
              deals={pipeline}
              onStageChange={handleStageChange}
              onDealClick={handleDealClick}
              currency={crmCurrency}
            />
          </div>
        )}
      </div>

      {/* Deal Modal */}
      <DealModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        deal={selectedDeal}
        onSaved={handleModalSaved}
        contacts={contacts.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }))}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* Delete Confirmation */}
      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={dealToDelete?.title}
          itemType="deal"
        />
      )}
    </div>
  );
}
