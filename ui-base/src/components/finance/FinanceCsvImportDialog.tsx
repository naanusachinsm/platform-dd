import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { financeService } from "@/api/financeService";
import { cn } from "@/lib/utils";

export type FinanceImportType = "vendors" | "products" | "expenses";

interface FinanceCsvImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  type: FinanceImportType;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

const CSV_DESCRIPTION: Record<FinanceImportType, string> = {
  vendors: "Upload a CSV file to bulk import vendors.",
  products: "Upload a CSV file to bulk import products and services.",
  expenses: "Upload a CSV file to bulk import expenses.",
};

const CSV_LABELS: Record<FinanceImportType, string> = {
  vendors: "Vendors",
  products: "Products",
  expenses: "Expenses",
};

const CSV_TEMPLATES: Record<FinanceImportType, { headers: string; sampleRow: string }> = {
  vendors: {
    headers: "name,email,phone,address,city,state,country,postalCode,website,notes",
    sampleRow: "Acme Supplies,contact@acme.com,+91-9876543210,123 MG Road,Mumbai,Maharashtra,India,400001,https://acme.com,Preferred supplier",
  },
  products: {
    headers: "name,description,type,unitPrice,unit,sku",
    sampleRow: "Web Development,Custom website development,SERVICE,50000,project,SVC-001",
  },
  expenses: {
    headers: "amount,expenseDate,description,category,vendor,paymentMethod,referenceNumber,currency,notes,isReimbursable",
    sampleRow: "1500,2026-03-15,Office stationery,Office Supplies,Acme Supplies,UPI,TXN-12345,INR,Monthly supplies,false",
  },
};

export default function FinanceCsvImportDialog({
  isOpen,
  onClose,
  onImported,
  type,
}: FinanceCsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = CSV_LABELS[type];

  const downloadTemplate = useCallback(() => {
    const template = CSV_TEMPLATES[type];
    const csv = `${template.headers}\n${template.sampleRow}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [type]);

  const reset = () => {
    setFile(null);
    setLoading(false);
    setResult(null);
    setDragOver(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const importFn =
        type === "vendors"
          ? financeService.importVendors.bind(financeService)
          : type === "products"
            ? financeService.importProducts.bind(financeService)
            : financeService.importExpenses.bind(financeService);

      const response = await importFn(file);

      if (response.success && response.data) {
        setResult(response.data);
        if (response.data.imported > 0) {
          toast.success(`${response.data.imported} records imported`);
          onImported();
        }
      } else {
        toast.error(response.message || "Import failed");
      }
    } catch {
      toast.error("An error occurred during import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {label}</DialogTitle>
          <DialogDescription>{CSV_DESCRIPTION[type]}</DialogDescription>
        </DialogHeader>

        <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-fit cursor-pointer">
          <Download className="mr-2 h-3.5 w-3.5" />
          Download Template
        </Button>

        {!result ? (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Click or drop to replace
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop a CSV file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">.csv files only</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">
                {result.imported} records imported successfully
              </span>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{result.errors.length} error(s)</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/50 p-3 text-xs space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
