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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DataTablePagination } from "@/components/common/DataTable";
import { NoDataState } from "@/components/common/NoDataState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { hrService } from "@/api/hrService";
import { userService } from "@/api/userService";
import type { HrLeaveType, HrLeaveRequest } from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ModuleName, ActionType } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import {
  createLeaveTypeColumns,
  createLeaveRequestColumns,
} from "./leaveColumns";
import LeaveTypeModal from "./LeaveTypeModal";
import LeaveRequestModal from "./LeaveRequestModal";

export default function LeavePage() {
  const user = useAppStore((s) => s.user);
  const [leaveTypeActions, setLeaveTypeActions] = useState<string[]>([]);
  const [leaveRequestActions, setLeaveRequestActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.HR_LEAVE_TYPE).then((res) => {
      if (res.success && res.data) setLeaveTypeActions(res.data.actions || []);
    });
    roleService.getRoleActions(user.role, ModuleName.HR_LEAVE_REQUEST).then((res) => {
      if (res.success && res.data) setLeaveRequestActions(res.data.actions || []);
    });
  }, [user]);

  const canPerformLeaveTypeAction = useMemo(
    () => (action: ActionType) => leaveTypeActions.includes(action),
    [leaveTypeActions]
  );
  const canPerformLeaveRequestAction = useMemo(
    () => (action: ActionType) => leaveRequestActions.includes(action),
    [leaveRequestActions]
  );

  // Leave Types state
  const [leaveTypes, setLeaveTypes] = useState<HrLeaveType[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(true);
  const [leaveTypesPage, setLeaveTypesPage] = useState(1);
  const [leaveTypesPageSize, setLeaveTypesPageSize] = useState(10);
  const [leaveTypesTotal, setLeaveTypesTotal] = useState(0);
  const [leaveTypesSearch, setLeaveTypesSearch] = useState("");
  const [leaveTypesDebouncedSearch, setLeaveTypesDebouncedSearch] = useState("");
  const [leaveTypeModalOpen, setLeaveTypeModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<HrLeaveType | null>(null);
  const [leaveTypeModalMode, setLeaveTypeModalMode] = useState<"create" | "edit" | "view">("create");
  const [leaveTypeDeleteOpen, setLeaveTypeDeleteOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<HrLeaveType | null>(null);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState<HrLeaveRequest[]>([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(true);
  const [leaveRequestsPage, setLeaveRequestsPage] = useState(1);
  const [leaveRequestsPageSize, setLeaveRequestsPageSize] = useState(10);
  const [leaveRequestsTotal, setLeaveRequestsTotal] = useState(0);
  const [leaveRequestsSearch, setLeaveRequestsSearch] = useState("");
  const [leaveRequestsDebouncedSearch, setLeaveRequestsDebouncedSearch] = useState("");
  const [leaveRequestModalOpen, setLeaveRequestModalOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<HrLeaveRequest | null>(null);
  const [leaveRequestModalMode, setLeaveRequestModalMode] = useState<"create" | "edit" | "view">("create");
  const [leaveRequestDeleteOpen, setLeaveRequestDeleteOpen] = useState(false);
  const [leaveRequestToDelete, setLeaveRequestToDelete] = useState<HrLeaveRequest | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Debounce leave types search (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setLeaveTypesDebouncedSearch(leaveTypesSearch), 500);
    return () => clearTimeout(timer);
  }, [leaveTypesSearch]);
  useEffect(() => {
    setLeaveTypesPage(1);
  }, [leaveTypesDebouncedSearch]);

  // Debounce leave requests search (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setLeaveRequestsDebouncedSearch(leaveRequestsSearch), 500);
    return () => clearTimeout(timer);
  }, [leaveRequestsSearch]);
  useEffect(() => {
    setLeaveRequestsPage(1);
  }, [leaveRequestsDebouncedSearch]);

  // Fetch leave types
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLeaveTypesLoading(true);
        const res = await hrService.getLeaveTypes({
          page: leaveTypesPage,
          limit: leaveTypesPageSize,
          search: leaveTypesDebouncedSearch || undefined,
          searchTerm: leaveTypesDebouncedSearch || undefined,
        });
        if (!cancelled && res.success && res.data) {
          setLeaveTypes(res.data.data);
          setLeaveTypesTotal(res.data.total);
        } else if (!cancelled) {
          setLeaveTypes([]);
          setLeaveTypesTotal(0);
        }
      } catch {
        if (!cancelled) {
          setLeaveTypes([]);
          setLeaveTypesTotal(0);
          toast.error("Failed to load leave types");
        }
      } finally {
        if (!cancelled) setLeaveTypesLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [leaveTypesPage, leaveTypesPageSize, leaveTypesDebouncedSearch]);

  // Fetch leave requests
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLeaveRequestsLoading(true);
        const res = await hrService.getLeaveRequests({
          page: leaveRequestsPage,
          limit: leaveRequestsPageSize,
          search: leaveRequestsDebouncedSearch || undefined,
          searchTerm: leaveRequestsDebouncedSearch || undefined,
        });
        if (!cancelled && res.success && res.data) {
          setLeaveRequests(res.data.data);
          setLeaveRequestsTotal(res.data.total);
        } else if (!cancelled) {
          setLeaveRequests([]);
          setLeaveRequestsTotal(0);
        }
      } catch {
        if (!cancelled) {
          setLeaveRequests([]);
          setLeaveRequestsTotal(0);
          toast.error("Failed to load leave requests");
        }
      } finally {
        if (!cancelled) setLeaveRequestsLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [leaveRequestsPage, leaveRequestsPageSize, leaveRequestsDebouncedSearch]);

  const refreshLeaveTypes = useCallback(async () => {
    try {
      setLeaveTypesLoading(true);
      const res = await hrService.getLeaveTypes({
        page: leaveTypesPage,
        limit: leaveTypesPageSize,
        search: leaveTypesDebouncedSearch || undefined,
        searchTerm: leaveTypesDebouncedSearch || undefined,
      });
      if (res.success && res.data) {
        setLeaveTypes(res.data.data);
        setLeaveTypesTotal(res.data.total);
      }
    } catch {
      toast.error("Failed to refresh leave types");
    } finally {
      setLeaveTypesLoading(false);
    }
  }, [leaveTypesPage, leaveTypesPageSize, leaveTypesDebouncedSearch]);

  const refreshLeaveRequests = useCallback(async () => {
    try {
      setLeaveRequestsLoading(true);
      const res = await hrService.getLeaveRequests({
        page: leaveRequestsPage,
        limit: leaveRequestsPageSize,
        search: leaveRequestsDebouncedSearch || undefined,
        searchTerm: leaveRequestsDebouncedSearch || undefined,
      });
      if (res.success && res.data) {
        setLeaveRequests(res.data.data);
        setLeaveRequestsTotal(res.data.total);
      }
    } catch {
      toast.error("Failed to refresh leave requests");
    } finally {
      setLeaveRequestsLoading(false);
    }
  }, [leaveRequestsPage, leaveRequestsPageSize, leaveRequestsDebouncedSearch]);

  const handleLeaveTypeAdd = () => {
    setSelectedLeaveType(null);
    setLeaveTypeModalMode("create");
    setLeaveTypeModalOpen(true);
  };
  const handleLeaveTypeView = (item: HrLeaveType) => {
    setSelectedLeaveType(item);
    setLeaveTypeModalMode("view");
    setLeaveTypeModalOpen(true);
  };
  const handleLeaveTypeEdit = (item: HrLeaveType) => {
    setSelectedLeaveType(item);
    setLeaveTypeModalMode("edit");
    setLeaveTypeModalOpen(true);
  };
  const handleLeaveTypeDelete = (item: HrLeaveType) => {
    setLeaveTypeToDelete(item);
    setLeaveTypeDeleteOpen(true);
  };
  const handleConfirmLeaveTypeDelete = async () => {
    if (!leaveTypeToDelete) return;
    try {
      const res = await hrService.deleteLeaveType(leaveTypeToDelete.id);
      if (res.success) {
        toast.success("Leave type deleted successfully");
        refreshLeaveTypes();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting leave type");
    } finally {
      setLeaveTypeDeleteOpen(false);
      setLeaveTypeToDelete(null);
    }
  };

  const handleLeaveRequestAdd = () => {
    setSelectedLeaveRequest(null);
    setLeaveRequestModalMode("create");
    setLeaveRequestModalOpen(true);
  };
  const handleLeaveRequestView = (item: HrLeaveRequest) => {
    setSelectedLeaveRequest(item);
    setLeaveRequestModalMode("view");
    setLeaveRequestModalOpen(true);
  };
  const handleLeaveRequestEdit = (item: HrLeaveRequest) => {
    setSelectedLeaveRequest(item);
    setLeaveRequestModalMode("edit");
    setLeaveRequestModalOpen(true);
  };
  const handleLeaveRequestDelete = (item: HrLeaveRequest) => {
    setLeaveRequestToDelete(item);
    setLeaveRequestDeleteOpen(true);
  };
  const handleConfirmLeaveRequestDelete = async () => {
    if (!leaveRequestToDelete) return;
    try {
      const res = await hrService.deleteLeaveRequest(leaveRequestToDelete.id);
      if (res.success) {
        toast.success("Leave request deleted successfully");
        refreshLeaveRequests();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting leave request");
    } finally {
      setLeaveRequestDeleteOpen(false);
      setLeaveRequestToDelete(null);
    }
  };

  const isAdmin = ["SUPERADMIN", "ADMIN", "SUPPORT"].includes(user?.role?.toUpperCase() || "");

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    userService.getUsers({ limit: 200 }).then((res) => {
      if (!cancelled && res.success && res.data) {
        setUserMap(
          new Map(
            res.data.data.map((u: any) => [
              u.id,
              `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            ])
          )
        );
      }
    });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const leaveTypeMap = useMemo(
    () => new Map(leaveTypes.map((lt) => [lt.id, lt.name])),
    [leaveTypes]
  );

  const leaveTypeColumns = useMemo(
    () =>
      createLeaveTypeColumns({
        canPerformAction: canPerformLeaveTypeAction,
        onView: handleLeaveTypeView,
        onEdit: handleLeaveTypeEdit,
        onDelete: canPerformLeaveTypeAction(ActionType.DELETE) ? handleLeaveTypeDelete : undefined,
      }),
    [canPerformLeaveTypeAction]
  );

  const leaveRequestColumns = useMemo(
    () =>
      createLeaveRequestColumns({
        canPerformAction: canPerformLeaveRequestAction,
        onView: handleLeaveRequestView,
        onEdit: handleLeaveRequestEdit,
        onDelete: canPerformLeaveRequestAction(ActionType.DELETE) ? handleLeaveRequestDelete : undefined,
        leaveTypeMap,
        userMap,
        isAdmin,
      }),
    [canPerformLeaveRequestAction, leaveTypeMap, userMap, isAdmin]
  );

  const leaveTypesTable = useReactTable({
    data: leaveTypes,
    columns: leaveTypeColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: Math.ceil(leaveTypesTotal / leaveTypesPageSize) || 1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex: leaveTypesPage - 1, pageSize: leaveTypesPageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: leaveTypesPage - 1, pageSize: leaveTypesPageSize })
          : updater;
      if (next.pageSize !== leaveTypesPageSize) setLeaveTypesPage(1);
      else setLeaveTypesPage(next.pageIndex + 1);
      setLeaveTypesPageSize(next.pageSize);
    },
  });

  const leaveRequestsTable = useReactTable({
    data: leaveRequests,
    columns: leaveRequestColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: Math.ceil(leaveRequestsTotal / leaveRequestsPageSize) || 1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex: leaveRequestsPage - 1, pageSize: leaveRequestsPageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: leaveRequestsPage - 1, pageSize: leaveRequestsPageSize })
          : updater;
      if (next.pageSize !== leaveRequestsPageSize) setLeaveRequestsPage(1);
      else setLeaveRequestsPage(next.pageIndex + 1);
      setLeaveRequestsPageSize(next.pageSize);
    },
  });

  const leaveTypeOptions = useMemo(
    () => leaveTypes.map((lt) => ({ id: lt.id, name: lt.name })),
    [leaveTypes]
  );

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <Tabs defaultValue="leave-types" className="w-full">
          <TabsList>
            <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
            <TabsTrigger value="leave-requests">Leave Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="leave-types" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <Input
                placeholder="Search leave types..."
                value={leaveTypesSearch}
                onChange={(e) => setLeaveTypesSearch(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              {canPerformLeaveTypeAction(ActionType.CREATE) && (
                <Button onClick={handleLeaveTypeAdd} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Leave Type
                </Button>
              )}
            </div>
            {leaveTypesLoading ? (
              <div className="rounded-md border p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Loading leave types...</p>
              </div>
            ) : leaveTypesTotal === 0 ? (
              <NoDataState
                title={leaveTypesDebouncedSearch ? "No Leave Types Found" : "No Leave Types Yet"}
                description={
                  leaveTypesDebouncedSearch
                    ? "No leave types match your search."
                    : "Get started by adding your first leave type."
                }
                onAction={canPerformLeaveTypeAction(ActionType.CREATE) ? handleLeaveTypeAdd : undefined}
              />
            ) : (
              <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="overflow-auto flex-1">
                  <DataTable columns={leaveTypeColumns} table={leaveTypesTable} />
                </div>
                <div className="mt-4 flex-shrink-0">
                  <DataTablePagination table={leaveTypesTable} totalCount={leaveTypesTotal} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leave-requests" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <Input
                placeholder="Search leave requests..."
                value={leaveRequestsSearch}
                onChange={(e) => setLeaveRequestsSearch(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              {canPerformLeaveRequestAction(ActionType.CREATE) && (
                <Button onClick={handleLeaveRequestAdd} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Leave Request
                </Button>
              )}
            </div>
            {leaveRequestsLoading ? (
              <div className="rounded-md border p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Loading leave requests...</p>
              </div>
            ) : leaveRequestsTotal === 0 ? (
              <NoDataState
                title={leaveRequestsDebouncedSearch ? "No Leave Requests Found" : "No Leave Requests Yet"}
                description={
                  leaveRequestsDebouncedSearch
                    ? "No leave requests match your search."
                    : "Use the Add Leave Request button above to submit a new request."
                }
              />
            ) : (
              <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="overflow-auto flex-1">
                  <DataTable columns={leaveRequestColumns} table={leaveRequestsTable} />
                </div>
                <div className="mt-4 flex-shrink-0">
                  <DataTablePagination table={leaveRequestsTable} totalCount={leaveRequestsTotal} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <LeaveTypeModal
        isOpen={leaveTypeModalOpen}
        onClose={() => {
          setLeaveTypeModalOpen(false);
          setSelectedLeaveType(null);
        }}
        onSuccess={refreshLeaveTypes}
        leaveType={selectedLeaveType}
        mode={leaveTypeModalMode}
      />

      <LeaveRequestModal
        isOpen={leaveRequestModalOpen}
        onClose={() => {
          setLeaveRequestModalOpen(false);
          setSelectedLeaveRequest(null);
        }}
        onSuccess={refreshLeaveRequests}
        leaveRequest={selectedLeaveRequest}
        mode={leaveRequestModalMode}
        leaveTypeOptions={leaveTypeOptions}
        isAdmin={["SUPERADMIN", "ADMIN", "SUPPORT"].includes(user?.role?.toUpperCase() || "")}
      />

      {canPerformLeaveTypeAction(ActionType.DELETE) && (
        <ConfirmDeleteDialog
          isOpen={leaveTypeDeleteOpen}
          onOpenChange={setLeaveTypeDeleteOpen}
          onConfirm={handleConfirmLeaveTypeDelete}
          onCancel={() => {
            setLeaveTypeDeleteOpen(false);
            setLeaveTypeToDelete(null);
          }}
          itemName={leaveTypeToDelete?.name}
          itemType="leave type"
        />
      )}

      {canPerformLeaveRequestAction(ActionType.DELETE) && (
        <ConfirmDeleteDialog
          isOpen={leaveRequestDeleteOpen}
          onOpenChange={setLeaveRequestDeleteOpen}
          onConfirm={handleConfirmLeaveRequestDelete}
          onCancel={() => {
            setLeaveRequestDeleteOpen(false);
            setLeaveRequestToDelete(null);
          }}
          itemName={leaveRequestToDelete?.id}
          itemType="leave request"
        />
      )}
    </div>
  );
}
