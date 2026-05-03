"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  DataTableViewOptions,
  DataTablePagination,
} from "@/components/common";
import { NoDataState } from "@/components/common/NoDataState";
import type { RbacAction } from "@/api/actionTypes";
import { actionService } from "@/api/actionService";
import { toast } from "sonner";
import { createActionColumns } from "./actionColumns";
import ActionModal from "./ActionModal";

export default function ActionsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [actions, setActions] = useState<RbacAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RbacAction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await actionService.getActions({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setActions(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setActions([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      setActions([]);
      toast.error("Failed to load actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [currentPage, pageSize, searchTerm]);

  const handleEditAction = (action: RbacAction) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleAddAction = () => {
    setSelectedAction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAction(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => createActionColumns({ onEditAction: handleEditAction }),
    []
  );

  const table = useReactTable({
    data: actions,
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
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex: currentPage - 1,
          pageSize,
        });
        if (newState.pageSize !== pageSize) {
          setCurrentPage(1);
        } else {
          setCurrentPage(newState.pageIndex + 1);
        }
        setPageSize(newState.pageSize);
      } else {
        if (updater.pageSize !== pageSize) {
          setCurrentPage(1);
        } else {
          setCurrentPage(updater.pageIndex + 1);
        }
        setPageSize(updater.pageSize);
      }
    },
  });

  return (
    <div className="w-full p-4">
      <div>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
              {actions.length > 0 && <DataTableViewOptions table={table} />}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddAction} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Action
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading actions...
                </p>
              </div>
            </div>
          ) : actions.length === 0 ? (
            <NoDataState
              title={searchTerm ? "No Actions Found" : "No Actions Available"}
              description={
                searchTerm
                  ? "No actions match your search criteria. Try adjusting your search term."
                  : "There are no actions in the system yet. Click 'Add Action' to create one."
              }
              actionLabel="Add Action"
              onAction={handleAddAction}
              showAction={!searchTerm}
            />
          ) : (
            <>
              <DataTable columns={columns} table={table} />
              <div className="mt-4">
                <DataTablePagination table={table} totalCount={totalItems} />
              </div>
            </>
          )}
        </div>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        action={selectedAction}
        onSuccess={fetchActions}
      />
    </div>
  );
}
