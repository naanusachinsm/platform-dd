"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronsUpDown, X } from "lucide-react";
import { toast } from "sonner";
import type { Role, PermissionStructure } from "@/api/roleTypes";
import type { RbacAction } from "@/api/actionTypes";
import type { RbacResource } from "@/api/resourceTypes";
import { roleService } from "@/api/roleService";
import { actionService } from "@/api/actionService";
import { resourceService } from "@/api/resourceService";

const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSuccess: () => void;
}

export default function RoleModal({
  isOpen,
  onClose,
  role,
  onSuccess,
}: RoleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allActions, setAllActions] = useState<RbacAction[]>([]);
  const [allResources, setAllResources] = useState<RbacResource[]>([]);
  const [permissions, setPermissions] = useState<PermissionStructure>({});
  const [loadingData, setLoadingData] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isEditing = !!role;

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchActionsAndResources();
      if (role) {
        form.reset({
          name: role.name,
          description: role.description || "",
        });
        setPermissions(role.permissions ? { ...role.permissions } : {});
      } else {
        form.reset({ name: "", description: "" });
        setPermissions({});
      }
      setDropdownOpen(false);
    }
  }, [isOpen, role, form]);

  const fetchActionsAndResources = async () => {
    setLoadingData(true);
    try {
      const [actionsRes, resourcesRes] = await Promise.all([
        actionService.getActions({ limit: 100 }),
        resourceService.getResources({ limit: 100 }),
      ]);

      if (actionsRes.success && actionsRes.data) {
        setAllActions(actionsRes.data.data);
      }
      if (resourcesRes.success && resourcesRes.data) {
        setAllResources(resourcesRes.data.data);
      }
    } catch {
      toast.error("Failed to load actions and resources");
    } finally {
      setLoadingData(false);
    }
  };

  const assignedResourceNames = useMemo(
    () => Object.keys(permissions),
    [permissions]
  );

  const allSelected =
    allResources.length > 0 &&
    assignedResourceNames.length === allResources.length;

  const handleToggleResource = (resourceName: string) => {
    setPermissions((prev) => {
      if (prev[resourceName] !== undefined) {
        const updated = { ...prev };
        delete updated[resourceName];
        return updated;
      }
      return { ...prev, [resourceName]: [] };
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setPermissions({});
    } else {
      setPermissions((prev) => {
        const updated = { ...prev };
        for (const r of allResources) {
          if (updated[r.name] === undefined) {
            updated[r.name] = [];
          }
        }
        return updated;
      });
    }
  };

  const handleRemoveResource = (resourceName: string) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      delete updated[resourceName];
      return updated;
    });
  };

  const handleToggleAction = (
    resourceName: string,
    actionName: string,
    checked: boolean
  ) => {
    setPermissions((prev) => {
      const currentActions = prev[resourceName] || [];
      const updatedActions = checked
        ? [...currentActions, actionName]
        : currentActions.filter((a) => a !== actionName);
      return { ...prev, [resourceName]: updatedActions };
    });
  };

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        permissions,
      };

      if (isEditing) {
        const response = await roleService.updateRole(role.id, payload);
        if (response.success) {
          toast.success("Role updated successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to update role");
        }
      } else {
        const response = await roleService.createRole(payload);
        if (response.success) {
          toast.success("Role created successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to create role");
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditing ? "Edit Role" : "Add Role"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the role details and permissions below."
              : "Fill in the details and assign permissions to create a new role."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="space-y-4 pb-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. MANAGER"
                          {...field}
                          readOnly={isEditing}
                          className={
                            isEditing
                              ? "bg-muted cursor-not-allowed"
                              : "uppercase"
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.toUpperCase().replace(/\s+/g, "_")
                            )
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
                          placeholder="Optional description for this role"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Role Permissions</h4>

                  {loadingData ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between cursor-pointer"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                          <span className="text-muted-foreground">
                            {assignedResourceNames.length > 0
                              ? `${assignedResourceNames.length} of ${allResources.length} resource(s) selected`
                              : "Select resources"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        {dropdownOpen && (
                          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                            <div className="max-h-[200px] overflow-y-auto p-1">
                              <div
                                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                onClick={handleSelectAll}
                              >
                                <div
                                  className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                                    allSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input"
                                  }`}
                                >
                                  {allSelected && (
                                    <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3354 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.5553 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className="font-medium">Select All</span>
                              </div>
                              <Separator className="my-1" />
                              {allResources.map((r) => {
                                const isChecked = assignedResourceNames.includes(r.name);
                                return (
                                  <div
                                    key={r.id}
                                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                    onClick={() => handleToggleResource(r.name)}
                                  >
                                    <div
                                      className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                                        isChecked
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : "border-input"
                                      }`}
                                    >
                                      {isChecked && (
                                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3354 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.5553 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    {r.name}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {assignedResourceNames.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No resources assigned. Use the dropdown above to
                          select resources.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {assignedResourceNames.map((resourceName) => {
                            const resourceActions =
                              permissions[resourceName] || [];
                            return (
                              <div
                                key={resourceName}
                                className="rounded-md border p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">
                                    {resourceName}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveResource(resourceName)
                                    }
                                    className="h-7 px-2 text-destructive hover:text-destructive cursor-pointer"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                  {allActions.map((action) => {
                                    const isChecked =
                                      resourceActions.includes(action.name);
                                    return (
                                      <label
                                        key={action.id}
                                        className="flex items-center gap-1.5 text-sm cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) =>
                                            handleToggleAction(
                                              resourceName,
                                              action.name,
                                              !!checked
                                            )
                                          }
                                          className="cursor-pointer"
                                        />
                                        {action.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t">
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
                disabled={isSubmitting || loadingData}
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
