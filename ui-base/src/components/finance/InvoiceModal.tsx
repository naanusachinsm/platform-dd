import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { financeService } from "@/api/financeService";
import { crmService } from "@/api/crmService";
import type { FinInvoice, FinTaxRate, FinProduct, FinInvoicePayment } from "@/api/financeTypes";
import { FINANCE_CURRENCIES, PaymentMethodLabels, formatCurrency } from "@/api/financeTypes";
import PaymentModal from "./PaymentModal";

const NONE_VALUE = "__none__";

const lineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
  taxRateId: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
});

const invoiceSchema = z.object({
  crmCompanyId: z.string().optional(),
  crmContactId: z.string().optional(),
  issueDate: z.date({ required_error: "Issue date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  currency: z.string().min(1).max(10),
  notes: z.string().max(2000).optional().or(z.literal("")),
  terms: z.string().max(2000).optional().or(z.literal("")),
  customerName: z.string().max(255).optional().or(z.literal("")),
  customerEmail: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: FinInvoice | null;
  onSaved: () => void;
  mode?: "create" | "edit" | "view";
}

export default function InvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSaved,
  mode = invoice ? "edit" : "create",
}: InvoiceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string; email?: string }[]>([]);
  const [taxRates, setTaxRates] = useState<FinTaxRate[]>([]);
  const [products, setProducts] = useState<FinProduct[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [fullInvoice, setFullInvoice] = useState<FinInvoice | null>(null);
  const isReadOnly = mode === "view";

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      crmCompanyId: undefined,
      crmContactId: undefined,
      issueDate: new Date(),
      dueDate: undefined,
      currency: "INR",
      notes: "",
      terms: "",
      customerName: "",
      customerEmail: "",
      items: [{ productId: undefined, description: "", quantity: 1, unitPrice: 0, taxRateId: undefined, discountPercent: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      crmService.getCompanies({ limit: 200 }),
      crmService.getContacts({ limit: 200 }),
      financeService.getTaxRates({ limit: 200, isActive: true }),
      financeService.getProducts({ limit: 200, isActive: true }),
    ]).then(([compRes, contRes, taxRes, prodRes]) => {
      if (compRes.success && compRes.data) setCompanies(compRes.data.data.map((c: any) => ({ id: c.id, name: c.name, email: c.email })));
      if (contRes.success && contRes.data) setContacts(contRes.data.data.map((c: any) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email })));
      if (taxRes.success && taxRes.data) setTaxRates(taxRes.data.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (invoice) {
      const loadInvoice = async () => {
        let loadedInvoice = invoice;
        if (!invoice.items) {
          try {
            const res = await financeService.getInvoice(invoice.id);
            if (res.success && res.data) loadedInvoice = res.data;
          } catch { /* use partial data */ }
        }
        setFullInvoice(loadedInvoice);
        form.reset({
          crmCompanyId: loadedInvoice.crmCompanyId || undefined,
          crmContactId: loadedInvoice.crmContactId || undefined,
          issueDate: new Date(loadedInvoice.issueDate),
          dueDate: new Date(loadedInvoice.dueDate),
          currency: loadedInvoice.currency || "INR",
          notes: loadedInvoice.notes || "",
          terms: loadedInvoice.terms || "",
          customerName: loadedInvoice.customerName || "",
          customerEmail: loadedInvoice.customerEmail || "",
          items: loadedInvoice.items?.length
            ? loadedInvoice.items.map((it) => ({
                productId: it.productId || undefined,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                taxRateId: it.taxRateId || undefined,
                discountPercent: it.discountPercent || 0,
              }))
            : [{ productId: undefined, description: "", quantity: 1, unitPrice: 0, taxRateId: undefined, discountPercent: 0 }],
        });
      };
      loadInvoice();
    } else {
      form.reset({
        crmCompanyId: undefined,
        crmContactId: undefined,
        issueDate: new Date(),
        dueDate: undefined,
        currency: "INR",
        notes: "",
        terms: "",
        customerName: "",
        customerEmail: "",
        items: [{ productId: undefined, description: "", quantity: 1, unitPrice: 0, taxRateId: undefined, discountPercent: 0 }],
      });
    }
  }, [isOpen, invoice, form]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        crmCompanyId: data.crmCompanyId || undefined,
        crmContactId: data.crmContactId || undefined,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        currency: data.currency,
        notes: data.notes || undefined,
        terms: data.terms || undefined,
        customerName: data.customerName || undefined,
        customerEmail: data.customerEmail || undefined,
        items: data.items.map((item, idx) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRateId: item.taxRateId || undefined,
          discountPercent: item.discountPercent || 0,
          sortOrder: idx,
        })),
      };

      const response = invoice
        ? await financeService.updateInvoice(invoice.id, payload)
        : await financeService.createInvoice(payload);

      if (response.success) {
        toast.success(invoice ? "Invoice updated successfully" : "Invoice created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save invoice");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "Create Invoice" : mode === "edit" ? "Edit Invoice" : "View Invoice";
  const desc = mode === "view" ? "Invoice details" : "Fill in the invoice details below";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer name" {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="customer@example.com" {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="crmCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (CRM)</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          const companyId = val === NONE_VALUE ? undefined : val;
                          field.onChange(companyId);
                          if (companyId) {
                            const company = companies.find((c) => c.id === companyId);
                            if (company) {
                              form.setValue("customerName", company.name);
                              if (company.email) form.setValue("customerEmail", company.email);
                            }
                          }
                        }}
                        value={field.value || NONE_VALUE}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="crmContactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact (CRM)</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          const contactId = val === NONE_VALUE ? undefined : val;
                          field.onChange(contactId);
                          if (contactId) {
                            const contact = contacts.find((c) => c.id === contactId);
                            if (contact) {
                              form.setValue("customerName", `${contact.firstName} ${contact.lastName}`);
                              if (contact.email) form.setValue("customerEmail", contact.email);
                            }
                          }
                        }}
                        value={field.value || NONE_VALUE}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {contacts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date *</FormLabel>
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
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date *</FormLabel>
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
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">Line Items *</FormLabel>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ productId: undefined, description: "", quantity: 1, unitPrice: 0, taxRateId: undefined, discountPercent: 0 })}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Item
                    </Button>
                  )}
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium pt-1">#{index + 1}</span>
                      {!isReadOnly && fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!isReadOnly && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field: prodField }) => (
                            <FormItem>
                              <FormLabel>Product / Service</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  const productId = val === NONE_VALUE ? undefined : val;
                                  prodField.onChange(productId);
                                  if (productId) {
                                    const product = products.find((p) => p.id === productId);
                                    if (product) {
                                      form.setValue(`items.${index}.description`, product.name);
                                      form.setValue(`items.${index}.unitPrice`, product.unitPrice);
                                      if (product.taxRateId) {
                                        form.setValue(`items.${index}.taxRateId`, product.taxRateId);
                                      }
                                    }
                                  }
                                }}
                                value={prodField.value || NONE_VALUE}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Input placeholder="Item description" {...field} readOnly={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0.01}
                                {...field}
                                readOnly={isReadOnly}
                                onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                {...field}
                                readOnly={isReadOnly}
                                onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.taxRateId`}
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
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {taxRates.map((tr) => (
                                  <SelectItem key={tr.id} value={tr.id}>{tr.name} ({tr.rate}%)</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountPercent`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount %</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
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
                  </div>
                ))}
                {form.formState.errors.items?.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes visible to customer..." rows={3} {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Payment terms..." rows={3} {...field} readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {fullInvoice && fullInvoice.payments && fullInvoice.payments.length > 0 && (
          <div className="shrink-0 border-t px-6 py-3 max-h-[180px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Payments ({fullInvoice.payments.length})</h4>
              {!isReadOnly && fullInvoice.status !== "PAID" && fullInvoice.status !== "CANCELLED" && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentModal(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Record Payment
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {fullInvoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs border rounded p-2">
                  <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                  <span className="font-medium">{formatCurrency(p.amount, fullInvoice.currency)}</span>
                  <span className="text-muted-foreground">{PaymentMethodLabels[p.paymentMethod] || p.paymentMethod}</span>
                  <span className="text-muted-foreground truncate max-w-[100px]">{p.referenceNumber || "—"}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium border-t pt-2">
              <span>Paid: {formatCurrency(fullInvoice.amountPaid, fullInvoice.currency)}</span>
              <span>Due: {formatCurrency(fullInvoice.amountDue, fullInvoice.currency)}</span>
            </div>
          </div>
        )}

        {invoice && !fullInvoice?.payments?.length && !isReadOnly && invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "DRAFT" && (
          <div className="shrink-0 border-t px-6 py-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentModal(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Record Payment
            </Button>
          </div>
        )}

        {!isReadOnly && (
          <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        )}

        {fullInvoice && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            invoice={fullInvoice}
            onSaved={async () => {
              setShowPaymentModal(false);
              try {
                const res = await financeService.getInvoice(fullInvoice.id);
                if (res.success && res.data) setFullInvoice(res.data);
              } catch { /* ignore */ }
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
