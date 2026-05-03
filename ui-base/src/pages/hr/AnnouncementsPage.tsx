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
import { Megaphone } from "lucide-react";
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
import type { HrAnnouncement } from "@/api/hrTypes";
import {
  HrAnnouncementStatus,
  HrAnnouncementType,
  HrAnnouncementPriority,
  HrAnnouncementTypeLabels,
  HrAnnouncementPriorityLabels,
} from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";
import AnnouncementModal from "./AnnouncementModal";
import { createAnnouncementColumns } from "./announcementColumns";

export default function AnnouncementsPage() {
  const { user } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [announcements, setAnnouncements] = useState<HrAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<HrAnnouncement | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<HrAnnouncement | null>(null);
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
  }, [debouncedSearchTerm, typeFilter, priorityFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await hrService.getAnnouncements({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm || undefined,
          searchTerm: debouncedSearchTerm || undefined,
          type: typeFilter !== "all" ? (typeFilter as HrAnnouncementType) : undefined,
          priority: priorityFilter !== "all" ? (priorityFilter as HrAnnouncementPriority) : undefined,
        });

        if (!isCancelled) {
          if (response.success && response.data) {
            setAnnouncements(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setAnnouncements([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!isCancelled) {
          setAnnouncements([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Error loading announcements");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchAnnouncements();
    return () => { isCancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, typeFilter, priorityFilter]);

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
          ModuleName.HR_ANNOUNCEMENT
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

  const refreshAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await hrService.getAnnouncements({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        searchTerm: debouncedSearchTerm || undefined,
        type: typeFilter !== "all" ? (typeFilter as HrAnnouncementType) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as HrAnnouncementPriority) : undefined,
      });
      if (response.success && response.data) {
        setAnnouncements(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      }
    } catch {
      toast.error("Error refreshing announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedAnnouncement(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleView = (announcement: HrAnnouncement) => {
    setSelectedAnnouncement(announcement);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (announcement: HrAnnouncement) => {
    setSelectedAnnouncement(announcement);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (announcement: HrAnnouncement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      const response = await hrService.deleteAnnouncement(announcementToDelete.id);
      if (response.success) {
        toast.success("Announcement deleted successfully");
        refreshAnnouncements();
      } else {
        toast.error(response.message || "Failed to delete announcement");
      }
    } catch {
      toast.error("Error deleting announcement");
    } finally {
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setAnnouncementToDelete(null);
  };

  const columns = useMemo(
    () =>
      createAnnouncementColumns({
        canPerformAction,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
      }),
    [canPerformAction]
  );

  const table = useReactTable({
    data: announcements,
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

  const hasFilters = debouncedSearchTerm || typeFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="w-full">
      <div className="space-y-4 p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
                  {Object.entries(HrAnnouncementTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Priorities</SelectItem>
                  {Object.entries(HrAnnouncementPriorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <DataTableViewOptions table={table} />
            {canPerformAction(ActionType.CREATE) && (
              <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
                <Megaphone className="mr-2 h-4 w-4" />
                Add Announcement
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading announcements...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasFilters ? "No Announcements Found" : "No Announcements Available"}
            description={
              hasFilters
                ? "No announcements match your filters. Try adjusting your search."
                : "Add your first announcement using the Add Announcement button."
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

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshAnnouncements}
        announcement={selectedAnnouncement}
        mode={modalMode}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={announcementToDelete?.title}
        itemType="announcement"
      />
    </div>
  );
}
