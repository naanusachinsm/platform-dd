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
import type { Role } from "@/api/roleTypes";
import { roleService } from "@/api/roleService";
import { toast } from "sonner";
import { createRoleColumns } from "./roleColumns";
import RoleModal from "./RoleModal";

export default function RolesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setRoles(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setRoles([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      setRoles([]);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [currentPage, pageSize, searchTerm]);

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => createRoleColumns({ onEditRole: handleEditRole }),
    []
  );

  const table = useReactTable({
    data: roles,
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
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
              {roles.length > 0 && <DataTableViewOptions table={table} />}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddRole} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading roles...
                </p>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <NoDataState
              title={searchTerm ? "No Roles Found" : "No Roles Available"}
              description={
                searchTerm
                  ? "No roles match your search criteria. Try adjusting your search term."
                  : "There are no roles in the system yet. Click 'Add Role' to create one."
              }
              actionLabel="Add Role"
              onAction={handleAddRole}
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

      <RoleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        role={selectedRole}
        onSuccess={fetchRoles}
      />
    </div>
  );
}
