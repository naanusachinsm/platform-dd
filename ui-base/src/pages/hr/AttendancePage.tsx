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
import type { HrAttendance } from "@/api/hrTypes";
import { HrAttendanceStatus } from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ModuleName, ActionType } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createAttendanceColumns } from "./attendanceColumns";
import AttendanceModal from "./AttendanceModal";

export default function AttendancePage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.HR_ATTENDANCE).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canPerformAction = useMemo(
    () => (action: ActionType) => moduleActions.includes(action),
    [moduleActions]
  );

  const [items, setItems] = useState<HrAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HrAttendance | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HrAttendance | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await hrService.getAttendanceRecords({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm || undefined,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? (statusFilter as HrAttendanceStatus) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
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
          toast.error("Failed to load attendance");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, startDate, endDate]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrService.getAttendanceRecords({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as HrAttendanceStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success && res.data) {
        setItems(res.data.data);
        setTotalItems(res.data.total);
      }
    } catch {
      toast.error("Failed to refresh attendance");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, startDate, endDate]);

  const handleAdd = () => {
    setSelectedItem(null);
    setModalMode("create");
    setIsModalOpen(true);
  };
  const handleView = (item: HrAttendance) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };
  const handleEdit = (item: HrAttendance) => {
    setSelectedItem(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };
  const handleDeleteClick = (item: HrAttendance) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await hrService.deleteAttendance(itemToDelete.id);
      if (res.success) {
        toast.success("Attendance deleted successfully");
        refresh();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting attendance");
    } finally {
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = useMemo(
    () =>
      createAttendanceColumns({
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

  const hasActiveFilters = !!debouncedSearchTerm || statusFilter !== "all" || !!startDate || !!endDate;

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Input
              placeholder="Search attendance..."
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
                <SelectItem value={HrAttendanceStatus.PRESENT}>Present</SelectItem>
                <SelectItem value={HrAttendanceStatus.ABSENT}>Absent</SelectItem>
                <SelectItem value={HrAttendanceStatus.HALF_DAY}>Half Day</SelectItem>
                <SelectItem value={HrAttendanceStatus.LATE}>Late</SelectItem>
                <SelectItem value={HrAttendanceStatus.ON_LEAVE}>On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px]"
            />
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          {canPerformAction(ActionType.CREATE) && (
            <Button onClick={handleAdd} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Attendance
            </Button>
          )}
        </div>

        {loading ? (
          <div className="rounded-md border p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading attendance...</p>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Attendance Found" : "No Attendance Yet"}
            description={
              hasActiveFilters
                ? "No attendance records match your filters."
                : "Get started by adding your first attendance record."
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

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={refresh}
        attendance={selectedItem}
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
          itemName={itemToDelete ? `${itemToDelete.userId} - ${itemToDelete.date}` : undefined}
          itemType="attendance record"
        />
      )}
    </div>
  );
}
