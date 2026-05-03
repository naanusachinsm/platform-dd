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
import { UserPlus, Upload } from "lucide-react";
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
import ContactModal from "@/components/crm/ContactModal";
import CsvImportDialog from "@/components/crm/CsvImportDialog";
import { crmService } from "@/api/crmService";
import type { CrmContact, CrmCompany } from "@/api/crmTypes";
import {
  ContactStatus,
  ContactStatusLabels,
  ContactSource,
  ContactSourceLabels,
} from "@/api/crmTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { createContactColumns } from "./columns";

export default function ContactsPage() {
  const user = useAppStore((s) => s.user);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.CRM_CONTACT).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canDelete = useMemo(() => moduleActions.includes(ActionType.DELETE), [moduleActions]);

  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Modal & delete state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<CrmContact | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, sourceFilter]);

  // Fetch contacts
  useEffect(() => {
    let cancelled = false;

    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await crmService.getContacts({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
        });

        if (!cancelled) {
          if (response.success && response.data) {
            setContacts(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
          } else {
            setContacts([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!cancelled) {
          setContacts([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load contacts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchContacts();
    return () => { cancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, sourceFilter]);

  // Fetch companies for the modal dropdown
  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      try {
        const response = await crmService.getCompanies({ limit: 200 });
        if (!cancelled && response.success && response.data) {
          setCompanies(response.data.data);
        }
      } catch {
        // non-critical, dropdown will just be empty
      }
    };

    fetchCompanies();
    return () => { cancelled = true; };
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmService.getContacts({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
      });

      if (response.success && response.data) {
        setContacts(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setContacts([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch {
      toast.error("Failed to refresh contacts");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, sourceFilter]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedContact(null);
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((contact: CrmContact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((contact: CrmContact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((contact: CrmContact) => {
    setContactToDelete(contact);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!contactToDelete) return;
    try {
      const response = await crmService.deleteContact(contactToDelete.id);
      if (response.success) {
        toast.success("Contact deleted successfully");
        refreshContacts();
      } else {
        toast.error(response.message || "Failed to delete contact");
      }
    } catch {
      toast.error("Error deleting contact");
    } finally {
      setIsDeleteOpen(false);
      setContactToDelete(null);
    }
  }, [contactToDelete, refreshContacts]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setContactToDelete(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedContact(null);
  }, []);

  const handleModalSaved = useCallback(() => {
    refreshContacts();
  }, [refreshContacts]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleSourceFilterChange = useCallback((value: string) => {
    setSourceFilter(value);
  }, []);

  const columns = useMemo(
    () =>
      createContactColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: canDelete ? handleDeleteClick : undefined,
      }),
    [handleView, handleEdit, handleDeleteClick, canDelete]
  );

  const table = useReactTable({
    data: contacts,
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

  const hasActiveFilters =
    debouncedSearchTerm || statusFilter !== "all" || sourceFilter !== "all";

  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Statuses</SelectItem>
                  {Object.entries(ContactStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Sources</SelectItem>
                  {Object.entries(ContactSourceLabels).map(([value, label]) => (
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
            <Button onClick={handleAdd} className="cursor-pointer w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading contacts...
              </p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={hasActiveFilters ? "No Contacts Found" : "No Contacts Yet"}
            description={
              hasActiveFilters
                ? "No contacts match your current filters. Try adjusting your search or filters."
                : "Get started by adding your first contact."
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

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        contact={selectedContact}
        onSaved={handleModalSaved}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* Delete Confirmation */}
      {canDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={
            contactToDelete
              ? `${contactToDelete.firstName} ${contactToDelete.lastName}`
              : undefined
          }
          itemType="contact"
        />
      )}
      <CsvImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshContacts}
        type="contacts"
      />
    </div>
  );
}
