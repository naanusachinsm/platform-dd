import { useState, useEffect } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTablePagination } from "@/components/common/DataTable";
import { NoDataState } from "@/components/common/NoDataState";
import { crmService } from "@/api/crmService";
import type { CrmAuditActivity } from "@/api/crmTypes";
import {
  CrmAuditActionLabels,
  CrmAuditActionColors,
  CrmAuditEntityTypeLabels,
} from "@/api/crmTypes";

const columns: ColumnDef<CrmAuditActivity>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as keyof typeof CrmAuditActionLabels;
      return (
        <Badge className={CrmAuditActionColors[action]}>
          {CrmAuditActionLabels[action]}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "entityType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("entityType") as keyof typeof CrmAuditEntityTypeLabels;
      return <Badge variant="outline">{CrmAuditEntityTypeLabels[type]}</Badge>;
    },
    size: 100,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("description") || "—"}</span>
    ),
    size: 300,
  },
  {
    id: "performer",
    header: "Performed By",
    cell: ({ row }) => {
      const user = row.original.performedByUser;
      if (!user) return <span className="text-muted-foreground text-sm">System</span>;
      const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
      return (
        <span className="text-sm">
          {capitalize(user.firstName)} {capitalize(user.lastName)}
        </span>
      );
    },
    size: 160,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleString()}
      </span>
    ),
    size: 180,
  },
];

export default function CrmActivitiesPage() {
  const [activities, setActivities] = useState<CrmAuditActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [entityTypeFilter]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const response = await crmService.getActivitiesLog({
          page: currentPage,
          limit: pageSize,
          entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
        });
        if (!cancelled) {
          if (response.success && response.data) {
            setActivities(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setActivities([]);
          }
        }
      } catch {
        if (!cancelled) {
          setActivities([]);
          toast.error("Failed to load activities");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [currentPage, pageSize, entityTypeFilter]);

  const table = useReactTable({
    data: activities,
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
      pagination: { pageIndex: currentPage - 1, pageSize },
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

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
                  {Object.entries(CrmAuditEntityTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading activities...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title="No Activities Yet"
            description="CRM activities will appear here as you create, update, or delete contacts, companies, and deals."
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
    </div>
  );
}
