import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { financeService } from "@/api/financeService";
import type { FinTaxRate } from "@/api/financeTypes";
import { TaxRateType, TaxRateTypeLabels } from "@/api/financeTypes";

const taxRateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  rate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate cannot exceed 100"),
  type: z.nativeEnum(TaxRateType),
  description: z.string().max(500).optional().or(z.literal("")),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

type TaxRateFormData = z.infer<typeof taxRateSchema>;

export interface TaxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxRate?: FinTaxRate | null;
  onSaved: () => void;
  mode?: "create" | "edit" | "view";
}

export default function TaxRateModal({
  isOpen,
  onClose,
  taxRate,
  onSaved,
  mode = taxRate ? "edit" : "create",
}: TaxRateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const isReadOnly = mode === "view";

  const form = useForm<TaxRateFormData>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: "",
      rate: 0,
      type: TaxRateType.GST,
      description: "",
      isDefault: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (taxRate) {
      form.reset({
        name: taxRate.name,
        rate: taxRate.rate,
        type: taxRate.type,
        description: taxRate.description || "",
        isDefault: taxRate.isDefault,
        isActive: taxRate.isActive,
      });
    } else {
      form.reset({
        name: "",
        rate: 0,
        type: TaxRateType.GST,
        description: "",
        isDefault: false,
        isActive: true,
      });
    }
  }, [isOpen, taxRate, form]);

  const onSubmit = async (data: TaxRateFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        rate: data.rate,
        type: data.type,
        description: data.description || undefined,
        isDefault: data.isDefault,
        isActive: data.isActive,
      };

      const response = taxRate
        ? await financeService.updateTaxRate(taxRate.id, payload)
        : await financeService.createTaxRate(payload);

      if (response.success) {
        toast.success(taxRate ? "Tax rate updated successfully" : "Tax rate created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save tax rate");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "Create Tax Rate" : mode === "edit" ? "Edit Tax Rate" : "View Tax Rate";
  const description = mode === "view" ? "Tax rate details" : "Fill in the tax rate details below";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. GST 18%" {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="0"
                          {...field}
                          readOnly={isReadOnly}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TaxRateTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description..." rows={2} {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                      </FormControl>
                      <FormLabel className="font-normal">Default tax rate</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                      </FormControl>
                      <FormLabel className="font-normal">Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {!isReadOnly && (
          <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {taxRate ? "Update Tax Rate" : "Create Tax Rate"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
