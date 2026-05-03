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
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import ActivityTimeline from "./ActivityTimeline";
import { cn } from "@/lib/utils";
import { crmService } from "@/api/crmService";
import { userService } from "@/api/userService";
import type { CrmDeal } from "@/api/crmTypes";
import {
  DealStage,
  DealStageLabels,
  DealPriority,
  DealPriorityLabels,
  convertCurrency,
  EXCHANGE_RATES_FROM_USD,
} from "@/api/crmTypes";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (\u20B9)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
];

const dealSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  value: z.coerce.number().min(0).optional().or(z.literal("")),
  currency: z.string().min(1).max(10),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  ownerId: z.string().min(1, "Assignee is required"),
  stage: z.nativeEnum(DealStage),
  priority: z.nativeEnum(DealPriority),
  expectedCloseDate: z.date({ required_error: "Expected close date is required" }),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type DealFormData = z.infer<typeof dealSchema>;

const NONE_VALUE = "__none__";

export interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: CrmDeal | null;
  onSaved: () => void;
  contacts: { id: string; firstName: string; lastName: string }[];
  companies: { id: string; name: string }[];
}

export default function DealModal({
  isOpen,
  onClose,
  deal,
  onSaved,
  contacts,
  companies,
}: DealModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      value: "",
      currency: "INR",
      contactId: undefined,
      companyId: undefined,
      ownerId: "",
      stage: DealStage.LEAD,
      priority: DealPriority.MEDIUM,
      expectedCloseDate: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    userService.getUsers({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        setUsers(res.data.data.map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })));
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (deal) {
      const dealCurrency = deal.currency || "INR";
      const displayValue = deal.value != null
        ? Math.round(convertCurrency(deal.value, dealCurrency))
        : "";
      form.reset({
        title: deal.title,
        value: displayValue,
        currency: dealCurrency,
        contactId: deal.contactId || undefined,
        companyId: deal.companyId || undefined,
        ownerId: deal.ownerId || "",
        stage: deal.stage,
        priority: deal.priority,
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : undefined,
        notes: deal.notes || "",
      });
    } else {
      form.reset({
        title: "",
        value: "",
        currency: "INR",
        contactId: undefined,
        companyId: undefined,
        ownerId: "",
        stage: DealStage.LEAD,
        priority: DealPriority.MEDIUM,
        expectedCloseDate: undefined,
        notes: "",
      });
    }
  }, [isOpen, deal, form]);

  const onSubmit = async (data: DealFormData) => {
    try {
      setSubmitting(true);
      const enteredValue = data.value !== "" && data.value !== undefined ? Number(data.value) : undefined;
      const rate = EXCHANGE_RATES_FROM_USD[data.currency] ?? 1;
      const valueInUsd = enteredValue != null ? Math.round((enteredValue / rate) * 100) / 100 : undefined;

      const payload = {
        title: data.title,
        value: valueInUsd,
        currency: data.currency,
        contactId: data.contactId || undefined,
        companyId: data.companyId || undefined,
        ownerId: data.ownerId || undefined,
        stage: data.stage,
        priority: data.priority,
        expectedCloseDate: data.expectedCloseDate
          ? format(data.expectedCloseDate, "yyyy-MM-dd")
          : undefined,
        notes: data.notes || undefined,
      };

      const response = deal
        ? await crmService.updateDeal(deal.id, payload)
        : await crmService.createDeal(payload);

      if (response.success) {
        toast.success(deal ? "Deal updated successfully" : "Deal created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save deal");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>{deal ? "Edit Deal" : "Create Deal"}</DialogTitle>
          <DialogDescription>
            {deal ? "Update deal information" : "Add a new deal to the pipeline"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Deal title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
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
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={(newCurrency) => {
                        const oldCurrency = field.value;
                        const currentValue = form.getValues("value");
                        if (currentValue !== "" && currentValue != null && Number(currentValue) > 0) {
                          const oldRate = EXCHANGE_RATES_FROM_USD[oldCurrency] ?? 1;
                          const newRate = EXCHANGE_RATES_FROM_USD[newCurrency] ?? 1;
                          const valueInUsd = Number(currentValue) / oldRate;
                          form.setValue("value", Math.round(valueInUsd * newRate));
                        }
                        field.onChange(newCurrency);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
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
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                      value={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? undefined : val)}
                      value={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
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
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DealStageLabels).map(([value, label]) => (
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DealPriorityLabels).map(([value, label]) => (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee *</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? "" : val)}
                      value={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full capitalize">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE} disabled>Select assignee</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="capitalize">
                            {u.firstName} {u.lastName}
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
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Close Date *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>

        {deal && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Activity</h4>
              <ActivityTimeline dealId={deal.id} />
            </div>
          </>
        )}
        </div>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deal ? "Update Deal" : "Create Deal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
