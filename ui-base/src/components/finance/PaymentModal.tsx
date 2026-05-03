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
import { financeService } from "@/api/financeService";
import type { FinInvoice } from "@/api/financeTypes";
import { PaymentMethod, PaymentMethodLabels, formatCurrency } from "@/api/financeTypes";

const NONE_VALUE = "__none__";

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FinInvoice;
  onSaved: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onSaved,
}: PaymentModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const paymentSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0").max(invoice.amountDue, `Amount cannot exceed ${formatCurrency(invoice.amountDue, invoice.currency)}`),
    paymentDate: z.date({ required_error: "Payment date is required" }),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    referenceNumber: z.string().max(100).optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
  });

  type PaymentFormData = z.infer<typeof paymentSchema>;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice.amountDue,
      paymentDate: new Date(),
      paymentMethod: undefined,
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      amount: invoice.amountDue,
      paymentDate: new Date(),
      paymentMethod: undefined,
      referenceNumber: "",
      notes: "",
    });
  }, [isOpen, invoice, form]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        amount: data.amount,
        paymentDate: format(data.paymentDate, "yyyy-MM-dd"),
        paymentMethod: data.paymentMethod || undefined,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      };

      const response = await financeService.recordPayment(invoice.id, payload);

      if (response.success) {
        toast.success("Payment recorded successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to record payment");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoiceNumber}.
            Amount due: {formatCurrency(invoice.amountDue, invoice.currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        max={invoice.amountDue}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                      value={field.value || NONE_VALUE}
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
                      <Input placeholder="e.g. TXN-12345" {...field} />
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
                      <Textarea placeholder="Payment notes..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
