"use client";

import { User as UserIcon, Mail, Phone, Shield } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";

export default function ProfilePage() {
  const { user } = useAppStore();

  if (!user) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              No user data available
            </h2>
            <p className="text-sm text-muted-foreground">
              Please log in to view your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.firstName || user.lastName || "";

  return (
    <div className="w-full px-2 py-2 space-y-12">
      <Card className="shadow-none border m-2">
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Name
              </label>
              <Input
                value={fullName}
                readOnly
                className="cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </label>
              <Input
                value={user.role || ""}
                readOnly
                className="cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              <Input
                type="tel"
                value=""
                readOnly
                className="cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                value={user.email || ""}
                readOnly
                className="cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
