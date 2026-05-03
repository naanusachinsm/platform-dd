import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Handshake,
  TrendingUp,
  Target,
  Calculator,
  Bell,
  Calendar,
  BarChart3,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmService } from "@/api/crmService";
import type { CrmDashboardStats } from "@/api/crmTypes";
import { DealStageLabels, STAGE_ORDER, ActivityTypeLabels, formatCrmCurrency } from "@/api/crmTypes";
import { useAppStore } from "@/stores/appStore";

const STAGE_COLORS: Record<string, string> = {
  LEAD: "#9ca3af",
  QUALIFIED: "#3b82f6",
  PROPOSAL: "#eab308",
  NEGOTIATION: "#f97316",
  CLOSED_WON: "#22c55e",
  CLOSED_LOST: "#ef4444",
};

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (\u20B9)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
];

interface KpiCard {
  label: string;
  value: string;
  icon: typeof Users;
  description: string;
  details: ReactNode;
}

export default function CrmDashboardPage() {
  const [stats, setStats] = useState<CrmDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const crmCurrency = useAppStore((s) => s.crmCurrency);
  const setCrmCurrency = useAppStore((s) => s.setCrmCurrency);

  const formatCurrency = useCallback(
    (value: number) => formatCrmCurrency(value, crmCurrency),
    [crmCurrency]
  );

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await crmService.getDashboardStats();
        if (!cancelled) {
          if (response.success && response.data) setStats(response.data);
          else toast.error(response.message || "Failed to load dashboard");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load dashboard stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const wonCount = stats.pipelineByStage.CLOSED_WON?.count ?? 0;
  const lostCount = stats.pipelineByStage.CLOSED_LOST?.count ?? 0;
  const closedTotal = wonCount + lostCount;
  const lossRate = closedTotal > 0 ? Math.round((lostCount / closedTotal) * 100) : 0;
  const openDeals = stats.totalDeals - wonCount - lostCount;

  const topKpis: KpiCard[] = [
    {
      label: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      description: "People tracked in your CRM",
      details: null,
    },
    {
      label: "Total Companies",
      value: stats.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Businesses in your pipeline",
      details: null,
    },
    {
      label: "Active Deals",
      value: stats.totalDeals.toLocaleString(),
      icon: Handshake,
      description: "All deals in your pipeline",
      details: (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><span className="font-medium text-foreground">{openDeals}</span> Open</span>
          <span className="text-border">|</span>
          <span><span className="font-medium text-foreground">{stats.pipelineByStage.CLOSED_WON?.count ?? 0}</span> Won</span>
          <span className="text-border">|</span>
          <span><span className="font-medium text-foreground">{stats.pipelineByStage.CLOSED_LOST?.count ?? 0}</span> Lost</span>
        </div>
      ),
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(stats.totalPipelineValue),
      icon: BarChart3,
      description: "Total value across all stages",
      details: null,
    },
  ];

  const bottomKpis: KpiCard[] = [
    {
      label: "Won Revenue",
      value: formatCurrency(stats.wonRevenue),
      icon: TrendingUp,
      description: "Revenue from closed-won deals",
      details: null,
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      description: "Percentage of deals closed as won",
      details: null,
    },
    {
      label: "Loss Rate",
      value: `${lossRate.toFixed(1)}%`,
      icon: Target,
      description: "Percentage of deals closed as lost",
      details: null,
    },
    {
      label: "Weighted Forecast",
      value: formatCurrency(stats.weightedForecast),
      icon: Calculator,
      description: "Probability-weighted pipeline value",
      details: null,
    },
  ];

  return (
    <div className="w-full flex flex-col h-full">
      <div className="space-y-6 p-6 flex flex-col flex-1 min-h-0 overflow-auto">

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          {topKpis.map((kpi) => (
            <Card key={kpi.label} className="@container/card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  {kpi.label === "Pipeline Value" ? (
                    <Select value={crmCurrency} onValueChange={setCrmCurrency}>
                      <SelectTrigger className="w-[90px] h-6 text-[10px] border-0 bg-transparent p-0 pr-2 justify-end gap-1 text-muted-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <kpi.icon className="size-4 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1">
                <div className="text-sm text-muted-foreground">{kpi.description}</div>
                {kpi.details}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          {bottomKpis.map((kpi) => (
            <Card key={kpi.label} className="@container/card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <kpi.icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1">
                <div className="text-sm text-muted-foreground">{kpi.description}</div>
                {kpi.details}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const chartData = STAGE_ORDER.map((stage) => ({
                  name: DealStageLabels[stage],
                  value: stats.pipelineByStage[stage]?.count ?? 0,
                  amount: stats.pipelineByStage[stage]?.value ?? 0,
                  color: STAGE_COLORS[stage],
                }));
                const hasData = chartData.some((d) => d.value > 0);

                return (
                  <div className="flex items-center gap-6">
                    <div className="relative w-[180px] h-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hasData ? chartData : [{ name: "Empty", value: 1, color: "#e5e7eb" }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={hasData ? 3 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {(hasData ? chartData : [{ name: "Empty", value: 1, color: "#e5e7eb" }]).map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          {hasData && (
                            <Tooltip
                              formatter={(value: number, name: string) => [`${value} deals`, name]}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                          )}
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{stats.totalDeals}</span>
                        <span className="text-[10px] text-muted-foreground">Total Deals</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium tabular-nums">{item.value}</span>
                            <span className="text-xs text-muted-foreground tabular-nums w-[80px] text-right">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.upcomingReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming reminders.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingReminders.map((activity) => (
                    <div key={activity.id} className="flex flex-col gap-1 rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-tight">{activity.subject}</span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {ActivityTypeLabels[activity.type]}
                        </Badge>
                      </div>
                      {(activity.contact || activity.deal) && (
                        <p className="text-xs text-muted-foreground">
                          {activity.contact && `${activity.contact.firstName} ${activity.contact.lastName}`}
                          {activity.contact && activity.deal && " \u00B7 "}
                          {activity.deal && activity.deal.title}
                        </p>
                      )}
                      {activity.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(activity.dueDate).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
