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
import type { HrLeaveType } from "@/api/hrTypes";
import { HrLeaveTypeStatus, HrLeaveTypeStatusLabels } from "@/api/hrTypes";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  defaultDays: z.coerce.number().min(0, "Must be 0 or more"),
  carryForward: z.boolean(),
  isPaid: z.boolean(),
  status: z.enum([HrLeaveTypeStatus.ACTIVE, HrLeaveTypeStatus.INACTIVE]),
});

type FormData = z.infer<typeof formSchema>;

interface LeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveType?: HrLeaveType | null;
  mode: "create" | "edit" | "view";
}

export default function LeaveTypeModal({
  isOpen,
  onClose,
  onSuccess,
  leaveType,
  mode,
}: LeaveTypeModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultDays: 0,
      carryForward: false,
      isPaid: true,
      status: HrLeaveTypeStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (leaveType) {
        form.reset({
          name: leaveType.name,
          description: leaveType.description || "",
          defaultDays: leaveType.defaultDays,
          carryForward: leaveType.carryForward,
          isPaid: leaveType.isPaid,
          status: leaveType.status,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          defaultDays: 0,
          carryForward: false,
          isPaid: true,
          status: HrLeaveTypeStatus.ACTIVE,
        });
      }
    }
  }, [isOpen, leaveType, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const response =
        mode === "edit" && leaveType
          ? await hrService.updateLeaveType(leaveType.id, data)
          : await hrService.createLeaveType(data);

      if (response.success) {
        toast.success(
          mode === "edit" ? "Leave type updated successfully" : "Leave type created successfully"
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
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Leave Type
          </DialogTitle>
          <DialogDescription>
            {mode === "view" ? "Viewing leave type details" : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={isReadOnly} placeholder="e.g. Annual Leave" />
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
                    <Textarea {...field} readOnly={isReadOnly} placeholder="Optional description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Days *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      readOnly={isReadOnly}
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carryForward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carry Forward</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? "yes" : "no"}
                      onValueChange={(v) => field.onChange(v === "yes")}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? "yes" : "no"}
                      onValueChange={(v) => field.onChange(v === "yes")}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
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
                        {Object.entries(HrLeaveTypeStatusLabels).map(([k, v]) => (
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
