import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ActivityTimeline from "./ActivityTimeline";
import { crmService } from "@/api/crmService";
import type { CrmContact } from "@/api/crmTypes";
import {
  ContactStatus,
  ContactStatusLabels,
  ContactSource,
  ContactSourceLabels,
} from "@/api/crmTypes";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z
    .union([z.string().email("Invalid email"), z.literal("")])
    .optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  jobTitle: z.string().max(255).optional().or(z.literal("")),
  companyId: z.string().optional(),
  status: z.nativeEnum(ContactStatus),
  source: z.nativeEnum(ContactSource).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

const NONE_VALUE = "__none__";

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: CrmContact | null;
  onSaved: () => void;
  companies: { id: string; name: string }[];
}

export default function ContactModal({
  isOpen,
  onClose,
  contact,
  onSaved,
  companies,
}: ContactModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: undefined,
      status: ContactStatus.LEAD,
      source: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (contact) {
      form.reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || "",
        phone: contact.phone || "",
        jobTitle: contact.jobTitle || "",
        companyId: contact.companyId || undefined,
        status: contact.status,
        source: contact.source || undefined,
        notes: contact.notes || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companyId: undefined,
        status: ContactStatus.LEAD,
        source: undefined,
        notes: "",
      });
    }
  }, [isOpen, contact, form]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        jobTitle: data.jobTitle || undefined,
        companyId: data.companyId || undefined,
        status: data.status,
        source: data.source || undefined,
        notes: data.notes || undefined,
      };

      const response = contact
        ? await crmService.updateContact(contact.id, payload)
        : await crmService.createContact(payload);

      if (response.success) {
        toast.success(
          contact
            ? "Contact updated successfully"
            : "Contact created successfully"
        );
        onSaved();
        onClose();
      } else {
        toast.error(response.message || "Failed to save contact");
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
          <DialogTitle>
            {contact ? "Edit Contact" : "Create Contact"}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? "Update contact information"
              : "Add a new contact to the CRM"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VP of Sales" {...field} />
                  </FormControl>
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
                    onValueChange={(val) =>
                      field.onChange(val === NONE_VALUE ? undefined : val)
                    }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ContactStatusLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === NONE_VALUE ? undefined : val)
                      }
                      value={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                        {Object.entries(ContactSourceLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
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

        {contact && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Activity</h4>
              <ActivityTimeline contactId={contact.id} />
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
            {contact ? "Update Contact" : "Create Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
