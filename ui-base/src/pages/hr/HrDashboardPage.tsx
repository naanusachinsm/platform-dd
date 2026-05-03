import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hrService } from "@/api/hrService";
import type { HrDashboardStats } from "@/api/hrTypes";

const kpiCards = [
  {
    key: "totalDepartments" as const,
    label: "Departments",
    description: "Active departments in the organization",
  },
  {
    key: "totalUsers" as const,
    label: "Team Members",
    description: "Total users in the organization",
  },
  {
    key: "pendingLeaveRequests" as const,
    label: "Pending Leaves",
    description: "Leave requests awaiting approval",
  },
  {
    key: "activeAnnouncements" as const,
    label: "Announcements",
    description: "Currently published announcements",
  },
];

export default function HrDashboardPage() {
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await hrService.getDashboardStats();
        if (!cancelled) {
          if (res.success && res.data) {
            setStats(res.data);
          } else {
            toast.error(res.message || "Failed to load dashboard");
          }
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load dashboard stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          {kpiCards.map((card) => (
            <Card key={card.key} className="@container/card">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full p-6">
        <p className="text-muted-foreground">Unable to load dashboard stats.</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {kpiCards.map((card) => {
          const value = stats[card.key];
          return (
            <Card key={card.key} className="@container/card">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {typeof value === "number" ? value : "-"}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1">
                <div className="text-sm text-muted-foreground">
                  {card.description}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
