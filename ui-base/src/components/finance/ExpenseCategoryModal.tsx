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
import { Loader2 } from "lucide-react";
import { financeService } from "@/api/financeService";
import type { FinExpenseCategory } from "@/api/financeTypes";

const expenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(500).optional().or(z.literal("")),
  isActive: z.boolean(),
});

type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;

export interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: FinExpenseCategory | null;
  onSaved: () => void;
  mode?: "create" | "edit" | "view";
}

export default function ExpenseCategoryModal({
  isOpen,
  onClose,
  category,
  onSaved,
  mode = category ? "edit" : "create",
}: ExpenseCategoryModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const isReadOnly = mode === "view";

  const form = useForm<ExpenseCategoryFormData>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
      });
    }
  }, [isOpen, category, form]);

  const onSubmit = async (data: ExpenseCategoryFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        description: data.description || undefined,
        isActive: data.isActive,
      };

      const response = category
        ? await financeService.updateExpenseCategory(category.id, payload)
        : await financeService.createExpenseCategory(payload);

      if (response.success) {
        toast.success(
          category ? "Category updated successfully" : "Category created successfully"
        );
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save category");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "Create Category" : mode === "edit" ? "Edit Category" : "View Category";
  const description = mode === "view" ? "Category details" : "Fill in the category details below";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
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
                      <Input placeholder="Category name" {...field} readOnly={isReadOnly} />
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
                      <Textarea placeholder="Optional description..." rows={3} {...field} readOnly={isReadOnly} />
                    </FormControl>
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
              {category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
