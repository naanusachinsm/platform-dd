import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { financeService } from "@/api/financeService";

interface EmailDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "invoice" | "estimate";
  documentId: string;
  documentNumber: string;
  defaultEmail?: string;
  customerName?: string;
  total?: number;
  currency?: string;
  dueDate?: string;
}

export default function EmailDocumentDialog({
  isOpen,
  onClose,
  type,
  documentId,
  documentNumber,
  defaultEmail,
  customerName,
  total,
  currency,
  dueDate,
}: EmailDocumentDialogProps) {
  const label = type === "invoice" ? "Invoice" : "Estimate";

  const defaultSubject = `${label} ${documentNumber}${customerName ? ` for ${customerName}` : ""}`;
  const formatAmt = (amt: number, cur: string) => new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(amt);
  const amountStr = total != null && currency ? formatAmt(total, currency) : "";
  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "";

  const lines = [`Dear ${customerName || "Customer"},`, "", `Please find attached ${label.toLowerCase()} ${documentNumber}.`];
  if (amountStr) lines.push(``, `Total Amount: ${amountStr}`);
  if (dueDateStr && type === "invoice") lines.push(`Due Date: ${dueDateStr}`);
  lines.push("", "Please let us know if you have any questions.", "", "Regards");
  const defaultMessage = lines.join("\n");

  const [to, setTo] = useState(defaultEmail || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Email address is required");
      return;
    }
    try {
      setSending(true);
      const emailFn = type === "invoice"
        ? financeService.emailInvoice.bind(financeService)
        : financeService.emailEstimate.bind(financeService);
      const res = await emailFn(documentId, {
        to: to.trim(),
        subject: subject.trim() || undefined,
        message: message.trim() || undefined,
      });
      if (res.success) {
        toast.success(`${label} emailed to ${to.trim()}`);
        onClose();
      } else {
        toast.error(res.message || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleOpen = (open: boolean) => {
    if (!open) {
      setTo(defaultEmail || "");
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email {label}</DialogTitle>
          <DialogDescription>Send {documentNumber} as a PDF attachment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>To *</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              placeholder={`${label} ${documentNumber}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder={`Please find attached ${label.toLowerCase()} ${documentNumber}.`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending || !to.trim()}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
