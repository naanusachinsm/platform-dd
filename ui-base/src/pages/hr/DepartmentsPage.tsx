"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { DataTable, DataTablePagination, DataTableViewOptions } from "@/components/common";
import { NoDataState } from "@/components/common/NoDataState";
import { hrService } from "@/api/hrService";
import type { HrDepartment } from "@/api/hrTypes";
import { HrDepartmentStatus } from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";
import DepartmentModal from "./DepartmentModal";
import { createDepartmentColumns } from "./departmentColumns";

export default function DepartmentsPage() {
  const { user } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [departments, setDepartments] = useState<HrDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<HrDepartment | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<HrDepartment | null>(null);
  const [moduleActions, setModuleActions] = useState<ActionType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await hrService.getDepartments({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm || undefined,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? (statusFilter as HrDepartmentStatus) : undefined,
        });

        if (!isCancelled) {
          if (response.success && response.data) {
            setDepartments(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setDepartments([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!isCancelled) {
          setDepartments([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Error loading departments");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDepartments();
    return () => { isCancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchModuleActions = async () => {
      if (!user?.role) {
        if (!isCancelled) setModuleActions([]);
        return;
      }
      try {
        const response = await roleService.getRoleActions(
          user.role,
          ModuleName.HR_DEPARTMENT
        );
        if (!isCancelled && response.success && response.data) {
          setModuleActions(response.data.actions || []);
        } else if (!isCancelled) {
          setModuleActions([]);
        }
      } catch {
        if (!isCancelled) setModuleActions([]);
      }
    };

    fetchModuleActions();
    return () => { isCancelled = true; };
  }, [user?.role]);

  const canPerformAction = useMemo(
    () => (action: ActionType) => moduleActions.includes(action),
    [moduleActions]
  );

  const refreshDepartments = async () => {
    try {
      setLoading(true);
      const response = await hrService.getDepartments({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as HrDepartmentStatus) : undefined,
      });
      if (response.success && response.data) {
        setDepartments(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      }
    } catch {
      toast.error("Error refreshing departments");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleView = (department: HrDepartment) => {
    setSelectedDepartment(department);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (department: HrDepartment) => {
    setSelectedDepartment(department);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (department: HrDepartment) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;
    try {
      const response = await hrService.deleteDepartment(departmentToDelete.id);
      if (response.success) {
        toast.success("Department deleted successfully");
        refreshDepartments();
      } else {
        toast.error(response.message || "Failed to delete department");
      }
    } catch {
      toast.error("Error deleting department");
    } finally {
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDepartmentToDelete(null);
  };

  const columns = useMemo(
    () =>
      createDepartmentColumns({
        canPerformAction,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
      }),
    [canPerformAction]
  );

  const table = useReactTable({
    data: departments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
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
      if (next.pageSize !== pageSize) setCurrentPage(1);
      else setCurrentPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
  });

  return (
    <div className="w-full">
      <div className="space-y-4 p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                  <SelectItem value={HrDepartmentStatus.ACTIVE} className="cursor-pointer">Active</SelectItem>
                  <SelectItem value={HrDepartmentStatus.INACTIVE} className="cursor-pointer">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <DataTableViewOptions table={table} />
            {canPerformAction(ActionType.CREATE) && (
              <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
                <Building2 className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading departments...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={debouncedSearchTerm || statusFilter !== "all" ? "No Departments Found" : "No Departments Available"}
            description={
              debouncedSearchTerm || statusFilter !== "all"
                ? "No departments match your filters. Try adjusting your search."
                : "Add your first department using the Add Department button."
            }
            showAction={false}
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

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshDepartments}
        department={selectedDepartment}
        mode={modalMode}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={departmentToDelete?.name}
        itemType="department"
      />
    </div>
  );
}
