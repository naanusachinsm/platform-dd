"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/stores/appStore";

export function TeamSwitcher() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const user = useAppStore((s) => s.user);

  const orgName = user?.organization?.name || "Byteful";
  const orgInitial = orgName.charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-pointer hover:bg-transparent active:bg-transparent focus-visible:ring-0"
        >
          {isCollapsed ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              {orgInitial}
            </div>
          ) : (
            <span className="text-xl font-semibold tracking-wider text-foreground font-brand">
              {orgName}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
