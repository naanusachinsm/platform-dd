import { useState, useEffect, useCallback } from "react";
import { Download, Eye, Trash2, FileIcon, ImageIcon, FileText, Film, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { projectService } from "@/api/projectService";
import type { Project, ProjectAsset } from "@/api/projectTypes";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NoDataState } from "@/components/common/NoDataState";
import { ConfirmDeleteDialog } from "@/components/common";

interface AssetsTabProps {
  project: Project;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(mimetype: string) {
  if (mimetype?.startsWith("image/")) return ImageIcon;
  if (mimetype?.startsWith("video/")) return Film;
  if (mimetype?.includes("pdf") || mimetype?.includes("document") || mimetype?.includes("text")) return FileText;
  return FileIcon;
}

function getFileTypeBadge(mimetype: string): string {
  if (!mimetype) return "File";
  if (mimetype.startsWith("image/")) return "Image";
  if (mimetype.startsWith("video/")) return "Video";
  if (mimetype.includes("pdf")) return "PDF";
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel") || mimetype.includes("csv")) return "Spreadsheet";
  if (mimetype.includes("document") || mimetype.includes("word")) return "Document";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "Presentation";
  if (mimetype.startsWith("text/")) return "Text";
  return mimetype.split("/").pop()?.toUpperCase() ?? "File";
}

function isPreviewable(mimetype: string): boolean {
  return mimetype?.startsWith("image/") || mimetype === "application/pdf";
}

export default function AssetsTab({ project }: AssetsTabProps) {
  const [allAssets, setAllAssets] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteAssetTarget, setDeleteAssetTarget] = useState<ProjectAsset | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.getAssets(project.id);
      if (res.success && res.data) setAllAssets(res.data.data ?? []);
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleDelete = (asset: ProjectAsset) => {
    setDeleteAssetTarget(asset);
  };

  const confirmDeleteAsset = async () => {
    if (!deleteAssetTarget) return;
    try {
      const res = await projectService.deleteAsset(project.id, deleteAssetTarget.id);
      if (res.success) {
        toast.success("Asset deleted");
        loadAssets();
      } else {
        toast.error(res.message ?? "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete asset");
    } finally {
      setDeleteAssetTarget(null);
    }
  };

  const handleDownload = async (asset: ProjectAsset) => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
    const url = asset.url.startsWith("http") ? asset.url : `${baseUrl}${asset.url}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = asset.originalname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Download failed");
    }
  };

  const handlePreview = (asset: ProjectAsset) => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
    const url = asset.url.startsWith("http") ? asset.url : `${baseUrl}${asset.url}`;
    window.open(url, "_blank");
  };

  const getInitials = (firstName?: string, lastName?: string) =>
    ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";

  const total = allAssets.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const paginatedAssets = allAssets.slice(startIdx, startIdx + pageSize);
  const startRow = total === 0 ? 0 : startIdx + 1;
  const endRow = Math.min(startIdx + pageSize, total);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (allAssets.length === 0) {
    return (
      <div className="p-6">
        <NoDataState title="No assets" description="Upload files using the Create dropdown to attach them to this project." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 h-full overflow-y-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssets.map((asset) => {
              const Icon = getFileIcon(asset.mimetype);
              return (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{asset.originalname}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{getFileTypeBadge(asset.mimetype)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</span>
                  </TableCell>
                  <TableCell>
                    {asset.uploadedByUser ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          {asset.uploadedByUser.avatarUrl && <AvatarImage src={asset.uploadedByUser.avatarUrl} alt="" />}
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {getInitials(asset.uploadedByUser.firstName, asset.uploadedByUser.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs capitalize">{asset.uploadedByUser.firstName} {asset.uploadedByUser.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(asset.createdAt), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {isPreviewable(asset.mimetype) && (
                        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => handlePreview(asset)} title="Preview">
                          <Eye className="size-3.5" />
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => handleDownload(asset)} title="Download">
                        <Download className="size-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => handleDelete(asset)} title="Delete">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {startRow} to {endRow} of {total} assets</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[65px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(1)} disabled={page <= 1}>
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-7" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-7" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteAssetTarget}
        onOpenChange={(v) => { if (!v) setDeleteAssetTarget(null); }}
        onConfirm={confirmDeleteAsset}
        onCancel={() => setDeleteAssetTarget(null)}
        title="Delete Asset"
        description={`Are you sure you want to delete "${deleteAssetTarget?.originalname}"? This action cannot be undone.`}
        itemType="asset"
      />
    </div>
  );
}
