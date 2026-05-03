import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { crmService } from "@/api/crmService";
import type { CrmActivity } from "@/api/crmTypes";
import {
  ActivityType,
  ActivityTypeLabels,
  ActivityStatus,
  ActivityStatusLabels,
} from "@/api/crmTypes";

const activitySchema = z.object({
  type: z.nativeEnum(ActivityType, { required_error: "Type is required" }),
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  activityDate: z.date({ required_error: "Date is required" }),
  activityTime: z.string().min(1, "Time is required"),
  durationMinutes: z.coerce.number().min(0).optional().or(z.literal("")),
  status: z.nativeEnum(ActivityStatus),
});

type ActivityFormData = z.infer<typeof activitySchema>;

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: CrmActivity | null;
  onSaved: () => void;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

function toTimeString(iso: string): string {
  if (!iso) return "09:00";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowTime(): string {
  return toTimeString(new Date().toISOString());
}

export default function ActivityModal({
  isOpen,
  onClose,
  activity,
  onSaved,
  contactId,
  companyId,
  dealId,
}: ActivityModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: ActivityType.NOTE,
      subject: "",
      description: "",
      activityDate: new Date(),
      activityTime: nowTime(),
      durationMinutes: "",
      status: ActivityStatus.PLANNED,
    },
  });

  const watchedType = form.watch("type");
  const showDuration =
    watchedType === ActivityType.CALL || watchedType === ActivityType.MEETING;

  useEffect(() => {
    if (!isOpen) return;
    if (activity) {
      form.reset({
        type: activity.type,
        subject: activity.subject,
        description: activity.description || "",
        activityDate: new Date(activity.activityDate),
        activityTime: toTimeString(activity.activityDate),
        durationMinutes: activity.durationMinutes ?? "",
        status: activity.status,
      });
    } else {
      form.reset({
        type: ActivityType.NOTE,
        subject: "",
        description: "",
        activityDate: new Date(),
        activityTime: nowTime(),
        durationMinutes: "",
        status: ActivityStatus.PLANNED,
      });
    }
  }, [isOpen, activity, form]);

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setSubmitting(true);

      const [hours, minutes] = data.activityTime.split(":").map(Number);
      const dateWithTime = new Date(data.activityDate);
      dateWithTime.setHours(hours, minutes, 0, 0);

      const payload = {
        type: data.type,
        subject: data.subject,
        description: data.description || undefined,
        activityDate: dateWithTime.toISOString(),
        durationMinutes:
          showDuration && data.durationMinutes !== "" && data.durationMinutes !== undefined
            ? Number(data.durationMinutes)
            : undefined,
        status: data.status,
        ...(activity
          ? {}
          : {
              contactId: contactId || undefined,
              companyId: companyId || undefined,
              dealId: dealId || undefined,
            }),
      };

      const response = activity
        ? await crmService.updateActivity(activity.id, payload)
        : await crmService.createActivity(payload);

      if (response.success) {
        toast.success(activity ? "Activity updated successfully" : "Activity created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save activity");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>{activity ? "Edit Activity" : "Log Activity"}</DialogTitle>
          <DialogDescription>
            {activity ? "Update activity details" : "Record a new activity"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ActivityTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ActivityStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Activity subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about this activity..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activityDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showDuration && (
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="30"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        </div>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activity ? "Update Activity" : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
