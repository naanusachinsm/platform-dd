import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileIcon, X, Loader2, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { hrService } from "@/api/hrService";
import { userService } from "@/api/userService";
import type { HrDocument } from "@/api/hrTypes";
import {
  HrDocumentType,
  HrDocumentTypeLabels,
} from "@/api/hrTypes";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const formSchema = z.object({
  scope: z.enum(["organization", "user"]),
  userId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(255),
  documentType: z.nativeEnum(HrDocumentType),
  fileUrl: z.string().min(1, "Please upload a file"),
  fileName: z.string().max(255).optional().or(z.literal("")),
  fileSize: z.coerce.number().int().min(0).optional().nullable(),
  isPublic: z.boolean(),
}).refine(
  (data) => data.scope === "organization" || (data.scope === "user" && data.userId && data.userId.length > 0),
  { message: "Please select a user", path: ["userId"] }
);

type FormData = z.infer<typeof formSchema>;

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document?: HrDocument | null;
  mode: "create" | "edit" | "view";
}

export default function DocumentModal({
  isOpen,
  onClose,
  onSuccess,
  document: doc,
  mode,
}: DocumentModalProps) {
  const isReadOnly = mode === "view";
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scope: "organization",
      userId: "",
      title: "",
      documentType: HrDocumentType.OTHER,
      fileUrl: "",
      fileName: "",
      fileSize: undefined,
      isPublic: false,
    },
  });

  const scope = form.watch("scope");
  const fileUrl = form.watch("fileUrl");
  const fileName = form.watch("fileName");
  const fileSize = form.watch("fileSize");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await userService.getUsers({ limit: 200 });
        if (!cancelled && res.success && res.data) {
          setUsers(
            res.data.data.map((u: any) => ({
              id: u.id,
              firstName: u.firstName || "",
              lastName: u.lastName || "",
              email: u.email,
            }))
          );
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (doc) {
        form.reset({
          scope: doc.userId ? "user" : "organization",
          userId: doc.userId || "",
          title: doc.title,
          documentType: doc.documentType,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName || "",
          fileSize: doc.fileSize ?? undefined,
          isPublic: doc.isPublic ?? false,
        });
      } else {
        form.reset({
          scope: "organization",
          userId: "",
          title: "",
          documentType: HrDocumentType.OTHER,
          fileUrl: "",
          fileName: "",
          fileSize: undefined,
          isPublic: false,
        });
      }
    }
  }, [isOpen, doc, form]);

  useEffect(() => {
    if (scope === "organization") {
      form.setValue("userId", "");
    }
  }, [scope, form]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = sessionStorage.getItem("accessToken");
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/upload/single`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();

      if (!data.success || !data.data?.files?.[0]) {
        toast.error(data.message || "File upload failed");
        return;
      }

      const uploaded = data.data.files[0];
      form.setValue("fileUrl", uploaded.url, { shouldValidate: true });
      form.setValue("fileName", uploaded.originalname || file.name);
      form.setValue("fileSize", uploaded.size || file.size);

      if (!form.getValues("title")) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", nameWithoutExt);
      }

      toast.success("File uploaded successfully");
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      uploadFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  const clearFile = () => {
    form.setValue("fileUrl", "");
    form.setValue("fileName", "");
    form.setValue("fileSize", undefined);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        userId: data.scope === "user" ? data.userId : undefined,
        title: data.title,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        fileName: data.fileName || undefined,
        fileSize: data.fileSize ?? undefined,
        isPublic: data.isPublic,
      };

      const response =
        mode === "edit" && doc
          ? await hrService.updateDocument(doc.id, payload)
          : await hrService.createDocument(payload);

      if (response.success) {
        toast.success(
          mode === "edit" ? "Document updated successfully" : "Document created successfully"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Operation failed");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Document
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing document details"
              : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fileUrl"
              render={() => (
                <FormItem>
                  <FormLabel>File *</FormLabel>
                  {fileUrl ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{fileName || "Uploaded file"}</span>
                        {fileSize ? (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatSize(fileSize)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={clearFile}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : !isReadOnly ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      )}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="size-7 mx-auto text-muted-foreground mb-2 animate-spin" />
                          <p className="text-sm font-medium">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="size-7 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">
                            Drag & drop a file here or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOC, images, and more
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No file attached</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={isReadOnly}
                      placeholder="Enter document title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Scope *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="organization" className="cursor-pointer">
                          Organization
                        </SelectItem>
                        <SelectItem value="user" className="cursor-pointer">
                          Specific User
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(HrDocumentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="cursor-pointer">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {scope === "user" && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly || usersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={usersLoading ? "Loading users..." : "Select a user"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="cursor-pointer">
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Public Document</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Public documents are visible to all users in the organization
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isReadOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "edit" ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
