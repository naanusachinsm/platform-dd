import { useEffect } from "react";
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
import { hrService } from "@/api/hrService";
import type { HrDesignation } from "@/api/hrTypes";
import { HrDesignationStatus, HrDesignationStatusLabels } from "@/api/hrTypes";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  level: z.coerce.number().int().min(0).optional().nullable(),
  status: z.nativeEnum(HrDesignationStatus),
});

type FormData = z.infer<typeof formSchema>;

interface DesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  designation?: HrDesignation | null;
  mode: "create" | "edit" | "view";
}

export default function DesignationModal({
  isOpen,
  onClose,
  onSuccess,
  designation,
  mode,
}: DesignationModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: "",
      level: undefined,
      status: HrDesignationStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (designation) {
        form.reset({
          name: designation.name,
          description: designation.description || "",
          departmentId: designation.departmentId || "",
          level: designation.level ?? undefined,
          status: designation.status,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          departmentId: "",
          level: undefined,
          status: HrDesignationStatus.ACTIVE,
        });
      }
    }
  }, [isOpen, designation, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        departmentId: data.departmentId || undefined,
        level: data.level ?? undefined,
        status: data.status,
      };

      const response =
        mode === "edit" && designation
          ? await hrService.updateDesignation(designation.id, payload)
          : await hrService.createDesignation(payload);

      if (response.success) {
        toast.success(
          mode === "edit" ? "Designation updated successfully" : "Designation created successfully"
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

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Designation
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing designation details"
              : "Fill in the details below"}
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
                    <Input {...field} readOnly={isReadOnly} placeholder="Enter designation name" />
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
                    <Textarea
                      {...field}
                      readOnly={isReadOnly}
                      rows={3}
                      placeholder="Enter description (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={isReadOnly}
                      placeholder="Enter department ID (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      readOnly={isReadOnly}
                      placeholder="Enter level (optional)"
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
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(HrDesignationStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="cursor-pointer">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isReadOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "edit" ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
