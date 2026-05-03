"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RbacResource } from "@/api/resourceTypes";
import { resourceService } from "@/api/resourceService";

const resourceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .transform((val) => val.toUpperCase().replace(/\s+/g, "_")),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: RbacResource | null;
  onSuccess: () => void;
}

export default function ResourceModal({
  isOpen,
  onClose,
  resource,
  onSuccess,
}: ResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!resource;

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        form.reset({
          name: resource.name,
          description: resource.description || "",
        });
      } else {
        form.reset({ name: "", description: "" });
      }
    }
  }, [isOpen, resource, form]);

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const response = await resourceService.updateResource(resource.id, data);
        if (response.success) {
          toast.success("Resource updated successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to update resource");
        }
      } else {
        const response = await resourceService.createResource(data);
        if (response.success) {
          toast.success("Resource created successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to create resource");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the resource details below."
              : "Fill in the details to create a new resource."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. REPORTS"
                      {...field}
                      readOnly={isEditing}
                      className={isEditing ? "bg-muted cursor-not-allowed" : "uppercase"}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase().replace(/\s+/g, "_"))
                      }
                    />
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
                      placeholder="Optional description for this resource"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
