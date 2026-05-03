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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, CalendarIcon, Upload, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { financeService } from "@/api/financeService";
import { uploadImage } from "@/api/uploadService";
import { API_CONFIG } from "@/config/constants";
import type { FinExpense, FinExpenseCategory, FinVendor } from "@/api/financeTypes";
import { PaymentMethod, PaymentMethodLabels, FINANCE_CURRENCIES } from "@/api/financeTypes";

const NONE_VALUE = "__none__";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.date({ required_error: "Expense date is required" }),
  description: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  referenceNumber: z.string().max(100).optional().or(z.literal("")),
  currency: z.string().min(1).max(10),
  notes: z.string().max(2000).optional().or(z.literal("")),
  isReimbursable: z.boolean(),
  receiptUrl: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: FinExpense | null;
  onSaved: () => void;
  mode?: "create" | "edit" | "view";
}

export default function ExpenseModal({
  isOpen,
  onClose,
  expense,
  onSaved,
  mode = expense ? "edit" : "create",
}: ExpenseModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<FinExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<FinVendor[]>([]);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const isReadOnly = mode === "view";

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      expenseDate: new Date(),
      description: "",
      categoryId: undefined,
      vendorId: undefined,
      paymentMethod: undefined,
      referenceNumber: "",
      currency: "INR",
      notes: "",
      isReimbursable: false,
      receiptUrl: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      financeService.getExpenseCategories({ limit: 200, isActive: true }),
      financeService.getVendors({ limit: 200, isActive: true }),
    ]).then(([catRes, vendRes]) => {
      if (catRes.success && catRes.data) setCategories(catRes.data.data);
      if (vendRes.success && vendRes.data) setVendors(vendRes.data.data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setReceiptFile(expense.receiptAssetId ? 'existing' : null);
      form.reset({
        amount: expense.amount,
        expenseDate: new Date(expense.expenseDate),
        description: expense.description || "",
        categoryId: expense.categoryId || undefined,
        vendorId: expense.vendorId || undefined,
        paymentMethod: expense.paymentMethod || undefined,
        referenceNumber: expense.referenceNumber || "",
        currency: expense.currency || "INR",
        notes: expense.notes || "",
        isReimbursable: expense.isReimbursable,
        receiptUrl: expense.receiptAssetId || undefined,
      });
    } else {
      setReceiptFile(null);
      form.reset({
        amount: 0,
        expenseDate: new Date(),
        description: "",
        categoryId: undefined,
        vendorId: undefined,
        paymentMethod: undefined,
        referenceNumber: "",
        currency: "INR",
        notes: "",
        isReimbursable: false,
        receiptUrl: undefined,
      });
    }
  }, [isOpen, expense, form]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        amount: data.amount,
        expenseDate: format(data.expenseDate, "yyyy-MM-dd"),
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        vendorId: data.vendorId || undefined,
        paymentMethod: data.paymentMethod || undefined,
        referenceNumber: data.referenceNumber || undefined,
        currency: data.currency,
        notes: data.notes || undefined,
        isReimbursable: data.isReimbursable,
        receiptAssetId: data.receiptUrl || undefined,
      };

      const response = expense
        ? await financeService.updateExpense(expense.id, payload)
        : await financeService.createExpense(payload);

      if (response.success) {
        toast.success(expense ? "Expense updated successfully" : "Expense created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save expense");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "Create Expense" : mode === "edit" ? "Edit Expense" : "View Expense";
  const desc = mode === "view" ? "Expense details" : "Fill in the expense details below";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0.01}
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
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FINANCE_CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={isReadOnly}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value || undefined} onSelect={(date) => field.onChange(date || null)} initialFocus />
                        </PopoverContent>
                      </Popover>
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
                      <Input placeholder="Expense description" {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                        value={field.value || NONE_VALUE}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                        value={field.value || NONE_VALUE}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
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
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                        value={field.value || NONE_VALUE}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {Object.entries(PaymentMethodLabels).map(([value, label]) => (
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
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TXN-12345" {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." rows={3} {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Receipt</FormLabel>
                {receiptFile ? (
                  <div className="flex items-center gap-2 mt-1 p-2 border rounded-md bg-muted/30">
                    <span className="text-sm truncate flex-1">{receiptFile === 'existing' ? 'Receipt attached' : receiptFile}</span>
                    {expense?.receiptAssetId && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <a href={`${API_CONFIG.baseUrl.replace('/api/v1', '')}${expense.receiptAssetId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {!isReadOnly && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { setReceiptFile(null); form.setValue("receiptUrl", undefined); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ) : !isReadOnly ? (
                  <div className="mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.jpg,.jpeg,.png,.webp";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          try {
                            setUploading(true);
                            const uploaded = await uploadImage(file);
                            form.setValue("receiptUrl", uploaded.url);
                            setReceiptFile(uploaded.originalname || file.name);
                            toast.success("Receipt uploaded");
                          } catch {
                            toast.error("Failed to upload receipt");
                          } finally {
                            setUploading(false);
                          }
                        };
                        input.click();
                      }}
                    >
                      {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                      {uploading ? "Uploading..." : "Upload Receipt"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No receipt attached</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="isReimbursable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                    <FormLabel className="font-normal">Reimbursable expense</FormLabel>
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
              {expense ? "Update Expense" : "Create Expense"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
