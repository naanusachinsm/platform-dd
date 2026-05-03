import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ColumnDef,
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
import { Plus, ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2, Archive, Users, UserPlus, X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDeleteDialog,
  DataTable,
  DataTableViewOptions,
  DataTablePagination,
} from "@/components/common";
import { NoDataState } from "@/components/common/NoDataState";
import { toast } from "sonner";
import { projectService } from "@/api/projectService";
import { userService } from "@/api/userService";
import type { Project, CreateProjectRequest, ProjectMember } from "@/api/projectTypes";
import { ProjectStatus } from "@/api/projectTypes";
import type { User } from "@/api/userTypes";
import { roleService } from "@/api/roleService";
import { ActionType, ModuleName } from "@/api/roleTypes";
import { useAppStore } from "@/stores/appStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const capitalize = (s?: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: "",
    key: "",
    description: "",
    leadUserId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [createMembers, setCreateMembers] = useState<User[]>([]);
  const [createUserSearch, setCreateUserSearch] = useState("");
  const [createOrgUsers, setCreateOrgUsers] = useState<User[]>([]);

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [membersProject, setMembersProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<string | null>(null);
  const [moduleActions, setModuleActions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjects({
          page: currentPage,
          limit: pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });

        if (!isCancelled) {
          if (response.success && response.data) {
            setProjects(response.data.data || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalItems(response.data.total || 0);
          } else {
            setProjects([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        }
      } catch {
        if (!isCancelled) {
          setProjects([]);
          setTotalPages(0);
          setTotalItems(0);
          toast.error("Failed to load projects");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchProjects();
    return () => { isCancelled = true; };
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    if (!user?.role) return;
    roleService.getRoleActions(user.role, ModuleName.PROJECT).then((res) => {
      if (res.success && res.data) setModuleActions(res.data.actions || []);
    });
  }, [user]);

  const canPerformAction = useMemo(() => {
    return (action: string): boolean => moduleActions.includes(action);
  }, [moduleActions]);

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (response.success && response.data) {
        setProjects(response.data.data || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalItems(response.data.total || 0);
      }
    } catch {
      toast.error("Failed to refresh projects");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter]);

  const openCreateDialog = async () => {
    setEditProject(null);
    setFormData({ name: "", key: "", description: "", leadUserId: "" });
    setIsCreateOpen(true);
    setCreateMembers([]);
    setCreateUserSearch("");
    try {
      const res = await userService.getUsers({ limit: 200 });
      if (res.success && res.data) {
        setCreateOrgUsers(res.data.data || []);
      }
    } catch {
      /* ignore */
    }
  };

  const openEditDialog = async (project: Project) => {
    setEditProject(project);
    setFormData({
      name: project.name,
      key: project.key,
      description: project.description || "",
      leadUserId: project.leadUserId || "",
    });
    setCreateMembers([]);
    setCreateUserSearch("");
    setIsCreateOpen(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        projectService.getMembers(project.id),
        userService.getUsers({ limit: 200 }),
      ]);
      if (usersRes.success && usersRes.data) {
        setCreateOrgUsers(usersRes.data.data || []);
      }
      if (membersRes.success && membersRes.data) {
        const memberUsers = (membersRes.data.data || [])
          .map((m: ProjectMember) => m.user)
          .filter(Boolean) as User[];
        setCreateMembers(memberUsers);
      }
    } catch {
      /* ignore */
    }
  };

  const handleUpdate = async () => {
    if (!editProject || !formData.name) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const response = await projectService.updateProject(editProject.id, {
        name: formData.name,
        description: formData.description,
        leadUserId: formData.leadUserId || undefined,
      });
      if (response.success) {
        const currentMemberIds = new Set(
          (editProject.members || []).map((m) => m.userId)
        );
        const selectedMemberIds = new Set(createMembers.map((m) => m.id));

        const toAdd = createMembers.filter((m) => !currentMemberIds.has(m.id));
        const toRemove = (editProject.members || []).filter(
          (m) => !selectedMemberIds.has(m.userId)
        );

        await Promise.all([
          ...toAdd.map((m) => projectService.addMember(editProject.id, m.id).catch(() => {})),
          ...toRemove.map((m) => projectService.removeMember(editProject.id, m.userId).catch(() => {})),
        ]);

        toast.success("Project updated");
        setIsCreateOpen(false);
        setEditProject(null);
        setFormData({ name: "", key: "", description: "", leadUserId: "" });
        setCreateMembers([]);
        refreshProjects();
      } else {
        toast.error(response.message || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.key) {
      toast.error("Name and key are required");
      return;
    }
    setSubmitting(true);
    try {
      const response = await projectService.createProject(formData);
      if (response.success && response.data) {
        const projectId = (response.data as any).id;
        for (const member of createMembers) {
          await projectService.addMember(projectId, member.id).catch(() => {});
        }
        toast.success("Project created");
        setIsCreateOpen(false);
        setFormData({ name: "", key: "", description: "", leadUserId: "" });
        setCreateMembers([]);
        refreshProjects();
      } else {
        toast.error(response.message || "Failed to create project");
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const createMemberIds = useMemo(
    () => new Set(createMembers.map((m) => m.id)),
    [createMembers]
  );

  const filteredCreateUsers = useMemo(() => {
    const available = createOrgUsers.filter((u) => !createMemberIds.has(u.id));
    if (!createUserSearch) return available;
    const q = createUserSearch.toLowerCase();
    return available.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [createOrgUsers, createMemberIds, createUserSearch]);

  const handleNameChange = (name: string) => {
    const key = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "")
      .slice(0, 10);
    setFormData((prev) => ({ ...prev, name, key }));
  };

  const handleDeleteProject = (project: Project) => {
    setDeleteProjectTarget(project);
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectTarget) return;
    try {
      const response = await projectService.deleteProject(deleteProjectTarget.id);
      if (response.success) {
        toast.success("Project deleted");
        refreshProjects();
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeleteProjectTarget(null);
    }
  };

  const handleManageMembers = async (project: Project) => {
    setMembersProject(project);
    setIsMembersOpen(true);
    setMembersLoading(true);
    setUserSearch("");
    try {
      const [membersRes, usersRes] = await Promise.all([
        projectService.getMembers(project.id),
        userService.getUsers({ limit: 200 }),
      ]);
      if (membersRes.success && membersRes.data) {
        setProjectMembers(membersRes.data.data || []);
      }
      if (usersRes.success && usersRes.data) {
        setOrgUsers(usersRes.data.data || []);
      }
    } catch {
      toast.error("Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!membersProject) return;
    try {
      const res = await projectService.addMember(membersProject.id, userId);
      if (res.success) {
        toast.success("Member added");
        const membersRes = await projectService.getMembers(membersProject.id);
        if (membersRes.success && membersRes.data) {
          setProjectMembers(membersRes.data.data || []);
        }
      } else {
        toast.error(res.message || "Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = (userId: string) => {
    setRemoveMemberTarget(userId);
  };

  const confirmRemoveMember = async () => {
    if (!membersProject || !removeMemberTarget) return;
    try {
      const res = await projectService.removeMember(membersProject.id, removeMemberTarget);
      if (res.success) {
        toast.success("Member removed");
        setProjectMembers((prev) => prev.filter((m) => m.userId !== removeMemberTarget));
      } else {
        toast.error(res.message || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoveMemberTarget(null);
    }
  };

  const memberUserIds = useMemo(
    () => new Set(projectMembers.map((m) => m.userId)),
    [projectMembers]
  );

  const availableUsers = useMemo(() => {
    const filtered = orgUsers.filter((u) => !memberUserIds.has(u.id));
    if (!userSearch) return filtered;
    const q = userSearch.toLowerCase();
    return filtered.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [orgUsers, memberUserIds, userSearch]);

  const columns: ColumnDef<Project>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Project Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span
            className="font-medium text-sm cursor-pointer hover:underline capitalize"
            onClick={() => navigate(`/dashboard/projects/${row.original.key}`)}
          >
            {row.original.name}
          </span>
        ),
        size: 250,
      },
      {
        accessorKey: "key",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Identifier
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs cursor-pointer"
            onClick={() => navigate(`/dashboard/projects/${row.original.key}`)}
          >
            {row.original.key}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Status
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={status === "ACTIVE" ? "default" : "secondary"} className="text-xs capitalize">
              {status === "ARCHIVED" && <Archive className="mr-1 h-3 w-3" />}
              {status.toLowerCase()}
            </Badge>
          );
        },
        size: 120,
      },
      {
        id: "members",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Members
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        accessorFn: (row) => row.members?.length ?? 0,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-sm">{row.original.members?.length ?? 0}</span>
          </div>
        ),
        size: 100,
      },
      {
        id: "createdBy",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Created By
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        accessorFn: (row) => {
          const c = row.creator;
          return c ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "";
        },
        cell: ({ row }) => {
          const creator = row.original.creator;
          if (!creator) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                {creator.avatarUrl && <AvatarImage src={creator.avatarUrl} />}
                <AvatarFallback className="text-[10px]">
                  {(creator.firstName?.charAt(0) || "") + (creator.lastName?.charAt(0) || "")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm capitalize">
                {capitalize(creator.firstName)} {capitalize(creator.lastName)}
              </span>
            </div>
          );
        },
        size: 160,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer h-8 px-2 -ml-2"
          >
            Created
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
        size: 140,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const project = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0 cursor-pointer">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/projects/${project.key}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Project
                </DropdownMenuItem>
                {canPerformAction(ActionType.UPDATE) && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => openEditDialog(project)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {canPerformAction(ActionType.DELETE) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer"
                      onClick={() => handleDeleteProject(project)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 60,
      },
    ],
    [navigate, canPerformAction]
  );

  const table = useReactTable({
    data: projects,
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
      if (typeof updater === "function") {
        const newState = updater({ pageIndex: currentPage - 1, pageSize });
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
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {!loading && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                  <SelectItem value={ProjectStatus.ACTIVE} className="cursor-pointer">Active</SelectItem>
                  <SelectItem value={ProjectStatus.ARCHIVED} className="cursor-pointer">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            {!loading && totalItems > 0 && (
              <DataTableViewOptions table={table} />
            )}
            {canPerformAction(ActionType.CREATE) && (
              <Button
                className="cursor-pointer w-full sm:w-auto"
                onClick={openCreateDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <NoDataState
            title={
              debouncedSearchTerm || statusFilter !== "all"
                ? "No Projects Found"
                : "No Projects Available"
            }
            description={
              debouncedSearchTerm || statusFilter !== "all"
                ? "No projects match your current search criteria. Try adjusting your search term or filters."
                : canPerformAction(ActionType.CREATE)
                  ? "There are no projects yet. Click 'New Project' to create your first project."
                  : "You are not part of any projects yet. Contact your admin to get added to a project."
            }
            showAction={false}
          />
        ) : (
          <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 150px)" }}>
            <div className="overflow-auto flex-1">
              <DataTable columns={columns} table={table} />
            </div>
            <div className="mt-4 flex-shrink-0">
              <DataTablePagination table={table} totalCount={totalItems} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setEditProject(null);
          setFormData({ name: "", key: "", description: "", leadUserId: "" });
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProject ? "Edit Project" : "Create Project"}</DialogTitle>
            <DialogDescription>
              {editProject
                ? "Update the project details below."
                : "Create a new project to organize and track your team's work."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g. My Project"
                value={formData.name}
                onChange={(e) => editProject
                  ? setFormData((prev) => ({ ...prev, name: e.target.value }))
                  : handleNameChange(e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key">Identifier</Label>
              <Input
                id="key"
                value={formData.key}
                disabled={!!editProject}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  }))
                }
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this project about?"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Lead <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Select
                value={formData.leadUserId || "__none__"}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, leadUserId: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {createOrgUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="capitalize">
                      {capitalize(u.firstName)} {capitalize(u.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Members */}
            <div className="grid gap-2">
              <Label>Team Members</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal cursor-pointer h-auto min-h-10"
                  >
                    {createMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {createMembers.map((u) => (
                          <Badge
                            key={u.id}
                            variant="secondary"
                            className="gap-1 pr-1 text-xs"
                          >
                            {capitalize(u.firstName)} {capitalize(u.lastName)}
                            <span
                              role="button"
                              tabIndex={0}
                              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCreateMembers((prev) =>
                                  prev.filter((m) => m.id !== u.id)
                                );
                              }}
                            >
                              <X className="size-3" />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select team members...</span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search users..."
                      value={createUserSearch}
                      onChange={(e) => setCreateUserSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                      {filteredCreateUsers.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No users found.
                        </p>
                      ) : (
                        filteredCreateUsers.map((user) => {
                          const isSelected = createMemberIds.has(user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              className="flex items-center gap-2 w-full py-1.5 px-2 rounded-md hover:bg-muted/50 text-left cursor-pointer"
                              onClick={() => {
                                if (isSelected) {
                                  setCreateMembers((prev) =>
                                    prev.filter((m) => m.id !== user.id)
                                  );
                                } else {
                                  setCreateMembers((prev) => [...prev, user]);
                                }
                              }}
                            >
                              <div className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary">
                                {isSelected && <Check className="size-3" />}
                              </div>
                              <Avatar className="size-6">
                                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                                <AvatarFallback className="text-[10px]">
                                  {(user.firstName?.charAt(0) || "") +
                                    (user.lastName?.charAt(0) || "")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-none truncate">
                                  {capitalize(user.firstName)} {capitalize(user.lastName)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={editProject ? handleUpdate : handleCreate}
              disabled={submitting || !formData.name || (!editProject && !formData.key)}
              className="cursor-pointer"
            >
              {submitting
                ? (editProject ? "Saving..." : "Creating...")
                : (editProject ? "Save Changes" : "Create Project")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Members - {membersProject?.name}</DialogTitle>
            <DialogDescription>
              Add or remove team members for this project.
            </DialogDescription>
          </DialogHeader>

          {membersLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Members */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Current Members ({projectMembers.length})
                </h4>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {projectMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No members yet</p>
                    ) : (
                      projectMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              {member.user?.avatarUrl && (
                                <AvatarImage src={member.user.avatarUrl} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {(member.user?.firstName?.charAt(0) || "") +
                                  (member.user?.lastName?.charAt(0) || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {capitalize(member.user?.firstName)} {capitalize(member.user?.lastName)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {member.role}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-red-600 cursor-pointer"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Add Members */}
              <div>
                <h4 className="text-sm font-medium mb-2">Add Members</h4>
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-2"
                />
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        {userSearch ? "No matching users found" : "All users are already members"}
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                              <AvatarFallback className="text-[10px]">
                                {(user.firstName?.charAt(0) || "") +
                                  (user.lastName?.charAt(0) || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {capitalize(user.firstName)} {capitalize(user.lastName)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            onClick={() => handleAddMember(user.id)}
                          >
                            <UserPlus className="size-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={!!deleteProjectTarget}
        onOpenChange={(v) => { if (!v) setDeleteProjectTarget(null); }}
        onConfirm={confirmDeleteProject}
        onCancel={() => setDeleteProjectTarget(null)}
        title="Delete Project"
        itemName={deleteProjectTarget?.name}
        itemType="project"
      />

      <ConfirmDeleteDialog
        isOpen={!!removeMemberTarget}
        onOpenChange={(v) => { if (!v) setRemoveMemberTarget(null); }}
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
        title="Remove Member"
        description={`Are you sure you want to remove this member from "${membersProject?.name || "the project"}"? They will lose access to this project.`}
        itemType="member"
        confirmButtonText="Remove"
      />
    </div>
  );
}
