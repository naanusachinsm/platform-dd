"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { hrService } from "@/api/hrService";
import type { HrAttendance } from "@/api/hrTypes";
import {
  HrAttendanceStatus,
  HrAttendanceStatusLabels,
} from "@/api/hrTypes";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().min(1, "Date is required"),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  totalHours: z.coerce.number().min(0, "Must be 0 or more"),
  status: z.enum([
    HrAttendanceStatus.PRESENT,
    HrAttendanceStatus.ABSENT,
    HrAttendanceStatus.HALF_DAY,
    HrAttendanceStatus.LATE,
    HrAttendanceStatus.ON_LEAVE,
  ]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attendance?: HrAttendance | null;
  mode: "create" | "edit" | "view";
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  attendance,
  mode,
}: AttendanceModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      date: "",
      clockIn: "",
      clockOut: "",
      totalHours: 0,
      status: HrAttendanceStatus.PRESENT,
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (attendance) {
        form.reset({
          userId: attendance.userId,
          date: attendance.date.split("T")[0],
          clockIn: attendance.clockIn || "",
          clockOut: attendance.clockOut || "",
          totalHours: attendance.totalHours,
          status: attendance.status,
          notes: attendance.notes || "",
        });
      } else {
        form.reset({
          userId: "",
          date: new Date().toISOString().split("T")[0],
          clockIn: "",
          clockOut: "",
          totalHours: 0,
          status: HrAttendanceStatus.PRESENT,
          notes: "",
        });
      }
    }
  }, [isOpen, attendance, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        userId: data.userId,
        date: data.date,
        clockIn: data.clockIn || undefined,
        clockOut: data.clockOut || undefined,
        totalHours: data.totalHours,
        status: data.status,
        notes: data.notes || undefined,
      };

      const response =
        mode === "edit" && attendance
          ? await hrService.updateAttendance(attendance.id, payload)
          : await hrService.createAttendance(payload);

      if (response.success) {
        toast.success(
          mode === "edit"
            ? "Attendance updated successfully"
            : "Attendance created successfully"
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
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Attendance
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing attendance details"
              : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={isReadOnly} placeholder="User ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} readOnly={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clockIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clock In</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} readOnly={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clockOut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clock Out</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} readOnly={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.5}
                      min={0}
                      {...field}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
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
                        {Object.entries(HrAttendanceStatusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      readOnly={isReadOnly}
                      placeholder="Optional notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
