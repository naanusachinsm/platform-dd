import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import confetti from "canvas-confetti";
import { crmService } from "@/api/crmService";
import { userService } from "@/api/userService";
import type { CrmDeal, CrmContact, CrmCompany } from "@/api/crmTypes";
import {
  DealStage,
  DealStageLabels,
  DealPriority,
  DealPriorityLabels,
  convertCurrency,
  EXCHANGE_RATES_FROM_USD,
} from "@/api/crmTypes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/dateFormat";

const DEAL_STAGES = Object.values(DealStage);
const DEAL_PRIORITIES = Object.values(DealPriority);
const NONE_VALUE = "__none__";

const STAGE_PROBABILITY: Record<DealStage, number> = {
  [DealStage.LEAD]: 10,
  [DealStage.QUALIFIED]: 25,
  [DealStage.PROPOSAL]: 50,
  [DealStage.NEGOTIATION]: 75,
  [DealStage.CLOSED_WON]: 100,
  [DealStage.CLOSED_LOST]: 0,
};

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (\u20B9)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
];

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<CrmDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState<number | "">(0);
  const [currency, setCurrency] = useState("INR");
  const [stage, setStage] = useState<DealStage>(DealStage.LEAD);
  const [priority, setPriority] = useState<DealPriority>(DealPriority.MEDIUM);
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");

  const populateForm = useCallback((d: CrmDeal) => {
    setTitle(d.title);
    const dealCurrency = d.currency || "INR";
    setCurrency(dealCurrency);
    setValue(d.value != null ? Math.round(convertCurrency(d.value, dealCurrency)) : 0);
    setStage(d.stage);
    setPriority(d.priority);
    setContactId(d.contactId || "");
    setCompanyId(d.companyId || "");
    setOwnerId(d.ownerId || "");
    setExpectedCloseDate(d.expectedCloseDate ? new Date(d.expectedCloseDate) : undefined);
    setNotes(d.notes || "");
  }, []);

  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [dealRes, contactsRes, companiesRes, usersRes] = await Promise.all([
          crmService.getDeal(dealId),
          crmService.getContacts({ limit: 200 }),
          crmService.getCompanies({ limit: 200 }),
          userService.getUsers({ limit: 200 }),
        ]);

        if (cancelled) return;

        if (!dealRes.success || !dealRes.data) {
          toast.error("Deal not found");
          navigate("/dashboard/crm/deals");
          return;
        }

        setDeal(dealRes.data);
        populateForm(dealRes.data);
        sessionStorage.setItem(`deal-title-${dealId}`, dealRes.data.title);

        if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data.data);
        if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data.data);
        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data.data.map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })));
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load deal");
          navigate("/dashboard/crm/deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dealId, navigate, populateForm]);

  const handleStageChange = (newStage: DealStage) => {
    setStage(newStage);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (value !== "" && value != null && Number(value) > 0) {
      const oldRate = EXCHANGE_RATES_FROM_USD[currency] ?? 1;
      const newRate = EXCHANGE_RATES_FROM_USD[newCurrency] ?? 1;
      const valueInUsd = Number(value) / oldRate;
      setValue(Math.round(valueInUsd * newRate));
    }
    setCurrency(newCurrency);
  };

  const handleSave = async () => {
    if (!deal || !title.trim()) return;
    setSaving(true);
    try {
      const enteredValue = value !== "" && value !== undefined ? Number(value) : undefined;
      const rate = EXCHANGE_RATES_FROM_USD[currency] ?? 1;
      const valueInUsd = enteredValue != null ? Math.round((enteredValue / rate) * 100) / 100 : undefined;

      const payload = {
        title: title.trim(),
        value: valueInUsd,
        currency,
        stage,
        priority,
        contactId: contactId || undefined,
        companyId: companyId || undefined,
        ownerId: ownerId || undefined,
        expectedCloseDate: expectedCloseDate ? format(expectedCloseDate, "yyyy-MM-dd") : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await crmService.updateDeal(deal.id, payload);
      if (res.success && res.data) {
        toast.success("Deal updated");
        if (stage === DealStage.CLOSED_WON && deal.stage !== DealStage.CLOSED_WON) {
          confetti({ particleCount: 100, spread: 60, angle: 60, origin: { x: 0, y: 0.6 } });
          confetti({ particleCount: 100, spread: 60, angle: 120, origin: { x: 1, y: 0.6 } });
        }
        setDeal(res.data);
        populateForm(res.data);
        sessionStorage.setItem(`deal-title-${deal.id}`, res.data.title);
      } else {
        toast.error(res.message ?? "Failed to update deal");
      }
    } catch {
      toast.error("Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Deal not found
      </div>
    );
  }

  const probability = STAGE_PROBABILITY[stage];

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden border-t">
      <div className="flex-1 lg:h-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:h-full">
          {/* Left Column - Fields */}
          <div className="p-6 space-y-5 lg:overflow-y-auto lg:border-r">
            <div className="space-y-2">
              <Label htmlFor="deal-title">Title</Label>
              <Input
                id="deal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deal title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={(v) => handleStageChange(v as DealStage)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{DealStageLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as DealPriority)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{DealPriorityLabels[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={contactId || NONE_VALUE}
                  onValueChange={(v) => setContactId(v === NONE_VALUE ? "" : v)}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={companyId || NONE_VALUE}
                  onValueChange={(v) => setCompanyId(v === NONE_VALUE ? "" : v)}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={ownerId || NONE_VALUE}
                  onValueChange={(v) => setOwnerId(v === NONE_VALUE ? "" : v)}
                >
                  <SelectTrigger className="w-full capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="capitalize">
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Close Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expectedCloseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expectedCloseDate ? format(expectedCloseDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expectedCloseDate}
                      onSelect={setExpectedCloseDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Probability
                <span className="text-xs text-muted-foreground font-normal ml-1">(auto-set by stage)</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${probability}%` }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums w-10 text-right">{probability}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={4}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Created: </span>
                {formatDateTime(deal.createdAt)}
              </div>
              <div>
                <span className="font-medium text-foreground">Updated: </span>
                {formatDateTime(deal.updatedAt)}
              </div>
              {deal.actualCloseDate && (
                <div>
                  <span className="font-medium text-foreground">Closed: </span>
                  {deal.actualCloseDate}
                </div>
              )}
              {deal.owner && (
                <div>
                  <span className="font-medium text-foreground">Owner: </span>
                  <span className="capitalize">{deal.owner.firstName} {deal.owner.lastName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="cursor-pointer gap-1.5"
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="flex flex-col border-t lg:border-t-0 lg:overflow-hidden">
            <div className="p-6 space-y-4 lg:flex-1 lg:overflow-y-auto">
              <h3 className="text-sm font-semibold">Activity</h3>
              <ActivityTimeline dealId={deal.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
