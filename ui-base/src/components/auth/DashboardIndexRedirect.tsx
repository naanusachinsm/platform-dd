import { Navigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { getDefaultRoute } from "./rolePermissions";

/**
 * Resolves `/dashboard` to role-specific home (USER → projects, admins → organizations).
 */
export default function DashboardIndexRedirect() {
  const user = useAppStore((s) => s.user);
  const route = getDefaultRoute(user?.role ?? "USER");
  return <Navigate to={route} replace />;
}
