import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { hrService } from "@/api/hrService";
import type { HrAnnouncement } from "@/api/hrTypes";
import {
  HrAnnouncementType,
  HrAnnouncementTypeLabels,
  HrAnnouncementPriority,
  HrAnnouncementPriorityLabels,
  HrAnnouncementStatus,
  HrAnnouncementStatusLabels,
} from "@/api/hrTypes";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  type: z.nativeEnum(HrAnnouncementType),
  priority: z.nativeEnum(HrAnnouncementPriority),
  publishedAt: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  isPinned: z.boolean(),
  status: z.nativeEnum(HrAnnouncementStatus),
});

type FormData = z.infer<typeof formSchema>;

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcement?: HrAnnouncement | null;
  mode: "create" | "edit" | "view";
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  announcement,
  mode,
}: AnnouncementModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      type: HrAnnouncementType.GENERAL,
      priority: HrAnnouncementPriority.MEDIUM,
      publishedAt: null,
      expiresAt: null,
      isPinned: false,
      status: HrAnnouncementStatus.DRAFT,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        form.reset({
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          priority: announcement.priority,
          publishedAt: announcement.publishedAt
            ? parseISO(announcement.publishedAt.split("T")[0])
            : null,
          expiresAt: announcement.expiresAt
            ? parseISO(announcement.expiresAt.split("T")[0])
            : null,
          isPinned: announcement.isPinned,
          status: announcement.status,
        });
      } else {
        form.reset({
          title: "",
          content: "",
          type: HrAnnouncementType.GENERAL,
          priority: HrAnnouncementPriority.MEDIUM,
          publishedAt: null,
          expiresAt: null,
          isPinned: false,
          status: HrAnnouncementStatus.DRAFT,
        });
      }
    }
  }, [isOpen, announcement, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        publishedAt: data.publishedAt
          ? format(data.publishedAt, "yyyy-MM-dd")
          : undefined,
        expiresAt: data.expiresAt
          ? format(data.expiresAt, "yyyy-MM-dd")
          : undefined,
        isPinned: data.isPinned,
        status: data.status,
      };

      const response =
        mode === "edit" && announcement
          ? await hrService.updateAnnouncement(announcement.id, payload)
          : await hrService.createAnnouncement(payload);

      if (response.success) {
        toast.success(
          mode === "edit" ? "Announcement updated successfully" : "Announcement created successfully"
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
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Announcement
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing announcement details"
              : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={isReadOnly} placeholder="Enter announcement title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      readOnly={isReadOnly}
                      rows={5}
                      placeholder="Enter announcement content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
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
                        {Object.entries(HrAnnouncementTypeLabels).map(([value, label]) => (
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
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(HrAnnouncementPriorityLabels).map(([value, label]) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="publishedAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Published At</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild disabled={isReadOnly}>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isReadOnly}
                          >
                            {field.value
                              ? format(field.value, "dd MMM yyyy")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expires At</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild disabled={isReadOnly}>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isReadOnly}
                          >
                            {field.value
                              ? format(field.value, "dd MMM yyyy")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const published = form.getValues("publishedAt");
                            return published ? date < published : false;
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel>Pinned</FormLabel>
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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(HrAnnouncementStatusLabels).map(([value, label]) => (
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
            {!isReadOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
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
