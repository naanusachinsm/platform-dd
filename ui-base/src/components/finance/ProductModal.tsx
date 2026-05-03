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
import type { FinProduct, FinTaxRate } from "@/api/financeTypes";
import { ProductType, ProductTypeLabels } from "@/api/financeTypes";

const NONE_VALUE = "__none__";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  type: z.nativeEnum(ProductType),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().max(50).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  taxRateId: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: FinProduct | null;
  onSaved: () => void;
  mode?: "create" | "edit" | "view";
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
  onSaved,
  mode = product ? "edit" : "create",
}: ProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [taxRates, setTaxRates] = useState<FinTaxRate[]>([]);
  const isReadOnly = mode === "view";

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      type: ProductType.PRODUCT,
      unitPrice: 0,
      unit: "",
      sku: "",
      taxRateId: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    financeService.getTaxRates({ limit: 200, isActive: true }).then((res) => {
      if (res.success && res.data) setTaxRates(res.data.data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        type: product.type,
        unitPrice: product.unitPrice,
        unit: product.unit || "",
        sku: product.sku || "",
        taxRateId: product.taxRateId || undefined,
        isActive: product.isActive,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        type: ProductType.PRODUCT,
        unitPrice: 0,
        unit: "",
        sku: "",
        taxRateId: undefined,
        isActive: true,
      });
    }
  }, [isOpen, product, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        unitPrice: data.unitPrice,
        unit: data.unit || undefined,
        sku: data.sku || undefined,
        taxRateId: data.taxRateId || undefined,
        isActive: data.isActive,
      };

      const response = product
        ? await financeService.updateProduct(product.id, payload)
        : await financeService.createProduct(payload);

      if (response.success) {
        toast.success(product ? "Product updated successfully" : "Product created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save product");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "Create Product" : mode === "edit" ? "Edit Product" : "View Product";
  const description = mode === "view" ? "Product details" : "Fill in the product details below";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
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
                      <Input placeholder="Product name" {...field} readOnly={isReadOnly} />
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
                      <Textarea placeholder="Product description..." rows={3} {...field} readOnly={isReadOnly} />
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
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ProductTypeLabels).map(([value, label]) => (
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
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0.00"
                          {...field}
                          readOnly={isReadOnly}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. piece, hour, kg" {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Stock keeping unit" {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="taxRateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                      value={field.value || NONE_VALUE}
                      disabled={isReadOnly}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select tax rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                        {taxRates.map((tr) => (
                          <SelectItem key={tr.id} value={tr.id}>
                            {tr.name} ({tr.rate}%)
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
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
