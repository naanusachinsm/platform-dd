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
import { FileText } from "lucide-react";
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
import type { HrDocument } from "@/api/hrTypes";
import { HrDocumentType, HrDocumentTypeLabels } from "@/api/hrTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";
import DocumentModal from "./DocumentModal";
import { createDocumentColumns } from "./documentColumns";

export default function DocumentsPage() {
  const { user } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [documents, setDocuments] = useState<HrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<HrDocument | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<HrDocument | null>(null);
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
  }, [debouncedSearchTerm, documentTypeFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await hrService.getDocuments({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm || undefined,
          searchTerm: debouncedSearchTerm || undefined,
          documentType: documentTypeFilter !== "all" ? (documentTypeFilter as HrDocumentType) : undefined,
        });

        if (!isCancelled) {
          if (response.success && response.data) {
            setDocuments(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setDocuments([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!isCancelled) {
          setDocuments([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Error loading documents");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDocuments();
    return () => { isCancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, documentTypeFilter]);

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
          ModuleName.HR_DOCUMENT
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

  const refreshDocuments = async () => {
    try {
      setLoading(true);
      const response = await hrService.getDocuments({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        searchTerm: debouncedSearchTerm || undefined,
        documentType: documentTypeFilter !== "all" ? (documentTypeFilter as HrDocumentType) : undefined,
      });
      if (response.success && response.data) {
        setDocuments(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      }
    } catch {
      toast.error("Error refreshing documents");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDocument(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleView = (document: HrDocument) => {
    setSelectedDocument(document);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (document: HrDocument) => {
    setSelectedDocument(document);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (document: HrDocument) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      const response = await hrService.deleteDocument(documentToDelete.id);
      if (response.success) {
        toast.success("Document deleted successfully");
        refreshDocuments();
      } else {
        toast.error(response.message || "Failed to delete document");
      }
    } catch {
      toast.error("Error deleting document");
    } finally {
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const isAdmin = ["SUPERADMIN", "ADMIN", "SUPPORT"].includes(user?.role?.toUpperCase() || "");

  const columns = useMemo(
    () =>
      createDocumentColumns({
        canPerformAction,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        isAdmin,
      }),
    [canPerformAction, isAdmin]
  );

  const table = useReactTable({
    data: documents,
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
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={documentTypeFilter} onValueChange={(v) => { setDocumentTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
                  {Object.entries(HrDocumentTypeLabels).map(([value, label]) => (
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
                <FileText className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={debouncedSearchTerm || documentTypeFilter !== "all" ? "No Documents Found" : "No Documents Available"}
            description={
              debouncedSearchTerm || documentTypeFilter !== "all"
                ? "No documents match your filters. Try adjusting your search."
                : "Add your first document using the Add Document button."
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

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshDocuments}
        document={selectedDocument}
        mode={modalMode}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={documentToDelete?.title}
        itemType="document"
      />
    </div>
  );
}
