import { ChevronRight, type LucideIcon } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
}

function CollapsedMenuItem({
  item,
  location,
}: {
  item: NavItem;
  location: ReturnType<typeof useLocation>;
}) {
  return (
    <SidebarMenuItem>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <SidebarMenuButton>
            {item.icon && <item.icon />}
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className="p-1 min-w-[160px]"
        >
          {item.items?.map((subItem) => {
            const isActive = location.pathname === subItem.url ||
              (subItem.url === "/dashboard/projects" && location.pathname.startsWith("/dashboard/projects"));
            return (
              <Link
                key={subItem.url}
                to={subItem.url}
                className={`flex items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : ""
                }`}
              >
                {subItem.title}
              </Link>
            );
          })}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          isCollapsed ? (
            <CollapsedMenuItem
              key={item.title}
              item={item}
              location={location}
            />
          ) : (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      let isSubItemActive =
                        location.pathname === subItem.url;

                      if (!isSubItemActive) {
                        if (
                          subItem.url === "/dashboard/organizations" &&
                          location.pathname === "/dashboard"
                        ) {
                          isSubItemActive = true;
                        } else if (
                          subItem.url === "/dashboard/courses" &&
                          location.pathname.startsWith("/dashboard/courses")
                        ) {
                          isSubItemActive = true;
                        } else if (
                          subItem.url === "/dashboard/projects" &&
                          location.pathname.startsWith("/dashboard/projects")
                        ) {
                          isSubItemActive = true;
                        }
                      }

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubItemActive}
                            className={
                              isSubItemActive
                                ? "bg-accent text-accent-foreground font-medium h-8"
                                : ""
                            }
                          >
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
