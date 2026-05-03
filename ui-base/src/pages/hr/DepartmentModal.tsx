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
import type { HrDepartment } from "@/api/hrTypes";
import {
  HrDepartmentStatus,
  HrDepartmentStatusLabels,
} from "@/api/hrTypes";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(HrDepartmentStatus),
});

type FormData = z.infer<typeof formSchema>;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department?: HrDepartment | null;
  mode: "create" | "edit" | "view";
}

export default function DepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  department,
  mode,
}: DepartmentModalProps) {
  const isReadOnly = mode === "view";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: HrDepartmentStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (department) {
        form.reset({
          name: department.name,
          description: department.description || "",
          status: department.status,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          status: HrDepartmentStatus.ACTIVE,
        });
      }
    }
  }, [isOpen, department, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        status: data.status,
      };

      const response =
        mode === "edit" && department
          ? await hrService.updateDepartment(department.id, payload)
          : await hrService.createDepartment(payload);

      if (response.success) {
        toast.success(
          mode === "edit" ? "Department updated successfully" : "Department created successfully"
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

  // Handle Dialog close - pass a function that receives open state
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create" : mode === "edit" ? "Edit" : "View"} Department
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Viewing department details"
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
                    <Input {...field} readOnly={isReadOnly} placeholder="Enter department name" />
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
                      {Object.entries(HrDepartmentStatusLabels).map(([value, label]) => (
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
