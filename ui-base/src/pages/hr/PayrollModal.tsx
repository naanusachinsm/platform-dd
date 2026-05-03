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
import { hrService } from "@/api/hrService";
import type { HrPayroll } from "@/api/hrTypes";
import { HrPayrollStatus, HrPayrollStatusLabels } from "@/api/hrTypes";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  month: z.coerce.number().min(1, "Month must be 1-12").max(12, "Month must be 1-12"),
  year: z.coerce.number().min(2000, "Year must be valid").max(2100, "Year must be valid"),
  basicSalary: z.coerce.number().min(0, "Must be 0 or more"),
  grossSalary: z.coerce.number().min(0, "Must be 0 or more"),
  netSalary: z.coerce.number().min(0, "Must be 0 or more"),
  status: z.enum([
    HrPayrollStatus.DRAFT,
    HrPayrollStatus.PROCESSED,
    HrPayrollStatus.PAID,
  ]),
});

type FormData = z.infer<typeof formSchema>;

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payroll?: HrPayroll | null;
  mode: "create" | "edit" | "view";
}

export default function PayrollModal({
  isOpen,
  onClose,
  onSuccess,
  payroll,
  mode,
}: PayrollModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      grossSalary: 0,
      netSalary: 0,
      status: HrPayrollStatus.DRAFT,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (payroll) {
        form.reset({
          userId: payroll.userId,
          month: payroll.month,
          year: payroll.year,
          basicSalary: payroll.basicSalary,
          grossSalary: payroll.grossSalary,
          netSalary: payroll.netSalary,
          status: payroll.status,
        });
      } else {
        form.reset({
          userId: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          basicSalary: 0,
          grossSalary: 0,
          netSalary: 0,
          status: HrPayrollStatus.DRAFT,
        });
      }
    }
  }, [isOpen, payroll, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        userId: data.userId,
        month: data.month,
        year: data.year,
        basicSalary: data.basicSalary,
        grossSalary: data.grossSalary,
        netSalary: data.netSalary,
        status: data.status,
      };

      const response =
        mode === "edit" && payroll
          ? await hrService.updatePayroll(payroll.id, payload)
          : await hrService.createPayroll(payload);

      if (response.success) {
        toast.success(
          mode === "edit"
            ? "Payroll updated successfully"
            : "Payroll created successfully"
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
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Payroll
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing payroll details"
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
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month (1-12) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={12}
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
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
              name="basicSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basic Salary *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.01}
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
              name="grossSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross Salary *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.01}
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
              name="netSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net Salary *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.01}
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
                        {Object.entries(HrPayrollStatusLabels).map(([k, v]) => (
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
