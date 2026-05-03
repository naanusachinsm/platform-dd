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
import type { RbacResource } from "@/api/resourceTypes";
import { resourceService } from "@/api/resourceService";
import { toast } from "sonner";
import { createResourceColumns } from "./resourceColumns";
import ResourceModal from "./ResourceModal";

export default function ResourcesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [resources, setResources] = useState<RbacResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<RbacResource | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getResources({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setResources(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setResources([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      setResources([]);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [currentPage, pageSize, searchTerm]);

  const handleEditResource = (resource: RbacResource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleAddResource = () => {
    setSelectedResource(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResource(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => createResourceColumns({ onEditResource: handleEditResource }),
    []
  );

  const table = useReactTable({
    data: resources,
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
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
              {resources.length > 0 && <DataTableViewOptions table={table} />}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddResource} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading resources...
                </p>
              </div>
            </div>
          ) : resources.length === 0 ? (
            <NoDataState
              title={
                searchTerm ? "No Resources Found" : "No Resources Available"
              }
              description={
                searchTerm
                  ? "No resources match your search criteria. Try adjusting your search term."
                  : "There are no resources in the system yet. Click 'Add Resource' to create one."
              }
              actionLabel="Add Resource"
              onAction={handleAddResource}
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

      <ResourceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        resource={selectedResource}
        onSuccess={fetchResources}
      />
    </div>
  );
}
