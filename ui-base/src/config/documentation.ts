import {
  Building2,
  Users,
  CreditCard,
  BookOpen,
} from "lucide-react";
import type { DocNavItem, DocPageMetadata } from "@/types/documentation";

export const docNavigation: DocNavItem[] = [
  {
    title: "Overview",
    url: "/documentation/overview",
    icon: BookOpen,
  },
  {
    title: "Organizations",
    url: "/documentation/organizations",
    icon: Building2,
  },
  {
    title: "User Management",
    url: "/documentation/user-management",
    icon: Users,
  },
  {
    title: "Subscriptions",
    url: "/documentation/subscriptions",
    icon: CreditCard,
  },
];

export const docPages: Record<string, DocPageMetadata> = {
  overview: {
    title: "Overview",
    description: "Introduction to the platform",
    path: "/documentation/overview",
    icon: BookOpen,
  },
  organizations: {
    title: "Organizations",
    description: "Multi-tenant organization management",
    path: "/documentation/organizations",
    icon: Building2,
  },
  "user-management": {
    title: "User Management",
    description: "Users, employees, roles, and permissions",
    path: "/documentation/user-management",
    icon: Users,
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Subscription plans, limits, and billing",
    path: "/documentation/subscriptions",
    icon: CreditCard,
  },
};
