import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Package, Upload, Download } from "lucide-react";
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
import { financeService } from "@/api/financeService";
import type { FinProduct } from "@/api/financeTypes";
import { ProductTypeLabels } from "@/api/financeTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createProductColumns } from "./columns";
import ProductModal from "@/components/finance/ProductModal";
import FinanceCsvImportDialog from "@/components/finance/FinanceCsvImportDialog";

export default function ProductsPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.FIN_PRODUCT).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(
    () => moduleActions.includes(ActionType.DELETE),
    [moduleActions]
  );

  const [products, setProducts] = useState<FinProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedData, setSelectedData] = useState<Map<string, FinProduct>>(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedProduct, setSelectedProduct] = useState<FinProduct | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<FinProduct | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, typeFilter]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await financeService.getProducts({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setProducts(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setProducts([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, debouncedSearchTerm, typeFilter]);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeService.getProducts({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });

      if (response.success && response.data) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setProducts([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, typeFilter]);

  const handleAdd = useCallback(() => {
    setSelectedProduct(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((product: FinProduct) => {
    setSelectedProduct(product);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((product: FinProduct) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product: FinProduct) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    try {
      const response = await financeService.deleteProduct(productToDelete.id);
      if (response.success) {
        toast.success("Product deleted successfully");
        refreshProducts();
      } else {
        toast.error(response.message || "Failed to delete product");
      }
    } catch {
      toast.error("Error deleting product");
    } finally {
      setIsDeleteOpen(false);
      setProductToDelete(null);
    }
  }, [productToDelete, refreshProducts]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setProductToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshProducts();
  }, [refreshProducts]);

  const columns = useMemo(
    () =>
      createProductColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  useEffect(() => {
    if (products.length > 0) {
      const restored: RowSelectionState = {};
      products.forEach((p) => { if (selectedIds.has(p.id)) restored[p.id] = true; });
      setRowSelection(restored);
    }
  }, [products]);

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSelectedIds((ids) => {
        const newIds = new Set(ids);
        products.forEach((p) => {
          if (next[p.id]) newIds.add(p.id);
          else newIds.delete(p.id);
        });
        return newIds;
      });
      setSelectedData((data) => {
        const newData = new Map(data);
        products.forEach((p) => {
          if (next[p.id]) newData.set(p.id, p);
          else newData.delete(p.id);
        });
        return newData;
      });
      return next;
    });
  }, [products]);

  const table = useReactTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: true,
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

      if (next.pageSize !== pageSize) {
        setCurrentPage(1);
      } else {
        setCurrentPage(next.pageIndex + 1);
      }
      setPageSize(next.pageSize);
    },
  });

  const hasActiveFilters = debouncedSearchTerm || typeFilter !== "all";

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Types
                  </SelectItem>
                  {Object.entries(ProductTypeLabels).map(([value, label]) => (
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
            {selectedIds.size > 0 && <Button
              variant="outline"
              onClick={() => {
                const rows = Array.from(selectedData.values());
                const headers = ["Name", "Description", "Type", "Unit Price", "Unit", "SKU", "Active"];
                const csv = [headers.join(","), ...rows.map((p) => [p.name, p.description || "", p.type, p.unitPrice, p.unit || "", p.sku || "", p.isActive ? "Yes" : "No"].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "products-export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`${rows.length} products exported`);
                setSelectedIds(new Set());
                setSelectedData(new Map());
                setRowSelection({});
              }}
              className="cursor-pointer w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedIds.size})
            </Button>}
            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading products...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Products Found" : "No Products Yet"}
            description={
              hasActiveFilters
                ? "No products match your current filters. Try adjusting your search or filters."
                : "Get started by adding your first product or service."
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        product={selectedProduct}
        mode={modalMode}
      />

      <FinanceCsvImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshProducts}
        type="products"
      />

      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={productToDelete?.name}
          itemType="product"
        />
      )}
    </div>
  );
}
