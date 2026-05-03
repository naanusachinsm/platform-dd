"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { hrService } from "@/api/hrService";
import type { HrLeaveRequest } from "@/api/hrTypes";
import {
  HrLeaveRequestStatus,
  HrLeaveRequestStatusLabels,
} from "@/api/hrTypes";

const formSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    daysCount: z.number().min(1, "Days must be at least 1"),
    reason: z.string().optional(),
    status: z
      .enum([
        HrLeaveRequestStatus.PENDING,
        HrLeaveRequestStatus.APPROVED,
        HrLeaveRequestStatus.REJECTED,
        HrLeaveRequestStatus.CANCELLED,
      ])
      .optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

type FormData = z.infer<typeof formSchema>;

function calculateDays(start: Date | undefined, end: Date | undefined): number {
  if (!start || !end || end < start) return 0;
  return differenceInCalendarDays(end, start) + 1;
}

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveRequest?: HrLeaveRequest | null;
  mode: "create" | "edit" | "view";
  leaveTypeOptions?: { id: string; name: string }[];
  isAdmin?: boolean;
}

export default function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
  leaveRequest,
  mode,
  leaveTypeOptions = [],
  isAdmin = false,
}: LeaveRequestModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: undefined,
      endDate: undefined,
      daysCount: 0,
      reason: "",
      status: HrLeaveRequestStatus.PENDING,
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    const days = calculateDays(startDate, endDate);
    form.setValue("daysCount", days, { shouldValidate: true });
  }, [startDate, endDate, form]);

  useEffect(() => {
    if (isOpen) {
      if (leaveRequest) {
        form.reset({
          leaveTypeId: leaveRequest.leaveTypeId,
          startDate: parseISO(leaveRequest.startDate.split("T")[0]),
          endDate: parseISO(leaveRequest.endDate.split("T")[0]),
          daysCount: leaveRequest.daysCount,
          reason: leaveRequest.reason || "",
          status: leaveRequest.status,
        });
      } else {
        form.reset({
          leaveTypeId: "",
          startDate: undefined,
          endDate: undefined,
          daysCount: 0,
          reason: "",
          status: HrLeaveRequestStatus.PENDING,
        });
      }
    }
  }, [isOpen, leaveRequest, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        leaveTypeId: data.leaveTypeId,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        daysCount: data.daysCount,
        reason: data.reason,
      };

      const response =
        mode === "edit" && leaveRequest
          ? await hrService.updateLeaveRequest(leaveRequest.id, {
              ...payload,
              status: data.status,
            })
          : await hrService.createLeaveRequest(payload);

      if (response.success) {
        toast.success(
          mode === "edit"
            ? "Leave request updated successfully"
            : "Leave request created successfully"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Leave Request
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing leave request details"
              : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type *</FormLabel>
                  <FormControl>
                    {leaveTypeOptions.length > 0 ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveTypeOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input {...field} readOnly={isReadOnly} placeholder="Leave type ID" />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < (startDate || new Date(new Date().setHours(0, 0, 0, 0)))
                          }
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
              name="daysCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      readOnly={isReadOnly}
                      placeholder="Optional reason for leave"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode !== "create" && leaveRequest && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isAdmin
                            ? Object.entries(HrLeaveRequestStatusLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))
                            : (
                              <>
                                <SelectItem value={HrLeaveRequestStatus.PENDING}>
                                  {HrLeaveRequestStatusLabels[HrLeaveRequestStatus.PENDING]}
                                </SelectItem>
                                <SelectItem value={HrLeaveRequestStatus.CANCELLED}>
                                  {HrLeaveRequestStatusLabels[HrLeaveRequestStatus.CANCELLED]}
                                </SelectItem>
                              </>
                            )
                          }
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!isReadOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
