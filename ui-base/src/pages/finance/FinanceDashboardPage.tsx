import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  Clock,
} from "lucide-react";
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
import { financeService } from "@/api/financeService";
import type { FinanceDashboardStats } from "@/api/financeTypes";
import {
  InvoiceStatusLabels,
  InvoiceStatusColors,
  FINANCE_CURRENCIES,
  formatCurrency,
} from "@/api/financeTypes";
import { useAppStore } from "@/stores/appStore";

const PERIOD_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
];

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const financeCurrency = useAppStore((s) => s.financeCurrency);
  const setFinanceCurrency = useAppStore((s) => s.setFinanceCurrency);

  const fetchStats = useCallback(async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const response = await financeService.getDashboardStats({
        period: selectedPeriod,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        toast.error(response.message || "Failed to load dashboard");
      }
    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await financeService.getDashboardStats({
          period,
          currency: financeCurrency !== "all" ? financeCurrency : undefined,
        });
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
    load();
    return () => {
      cancelled = true;
    };
  }, [period, financeCurrency]);

  const handlePeriodChange = useCallback(
    (value: string) => {
      setPeriod(value);
    },
    [fetchStats]
  );

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const displayCurrency = financeCurrency !== "all" ? financeCurrency : "INR";
  const fmtKpi = (amount: number) => {
    const locale = displayCurrency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, { style: "currency", currency: displayCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const kpis = [
    {
      label: "Total Revenue",
      value: fmtKpi(stats.totalRevenue),
      description: "Income from paid invoices",
    },
    {
      label: "Total Expenses",
      value: fmtKpi(stats.totalExpenses),
      description: `${stats.totalExpenseCount} expense${stats.totalExpenseCount !== 1 ? "s" : ""} recorded`,
    },
    {
      label: "Net Profit",
      value: fmtKpi(stats.netProfit),
      description: "Revenue minus expenses",
    },
    {
      label: "Outstanding",
      value: fmtKpi(stats.outstanding),
      description: `${stats.totalInvoices} total invoice${stats.totalInvoices !== 1 ? "s" : ""}`,
    },
    {
      label: "Overdue",
      value: fmtKpi(stats.overdue),
      description: `${stats.overdueCount} overdue invoice${stats.overdueCount !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="w-full flex flex-col h-full">
      <div className="space-y-6 p-6 flex flex-col flex-1 min-h-0 overflow-auto">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Select value={financeCurrency} onValueChange={setFinanceCurrency}>
              <SelectTrigger className="w-[130px] cursor-pointer">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  All Currencies
                </SelectItem>
                {FINANCE_CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="cursor-pointer">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px] cursor-pointer">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-5 dark:*:data-[slot=card]:bg-card">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="@container/card">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1">
                <div className="text-sm text-muted-foreground">
                  {kpi.description}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent invoices.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {invoice.invoiceNumber}
                          </span>
                          <Badge className={InvoiceStatusColors[invoice.status]}>
                            {InvoiceStatusLabels[invoice.status]}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {invoice.customerName || invoice.crmCompany?.name || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className="text-sm font-medium">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Receipt className="h-4 w-4" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent expenses.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {expense.description || "Expense"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {expense.category && (
                            <Badge variant="outline" className="text-xs">
                              {expense.category.name}
                            </Badge>
                          )}
                          {expense.vendor && (
                            <span className="truncate">{expense.vendor.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(expense.amount, expense.currency)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </div>
                      </div>
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
