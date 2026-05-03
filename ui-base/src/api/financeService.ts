import { apiService } from "./apiService";
import type {
  FinTaxRate,
  CreateTaxRateRequest,
  UpdateTaxRateRequest,
  FinProduct,
  CreateProductRequest,
  UpdateProductRequest,
  FinVendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  FinInvoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  FinInvoicePayment,
  CreatePaymentRequest,
  FinEstimate,
  CreateEstimateRequest,
  UpdateEstimateRequest,
  FinRecurringInvoice,
  CreateRecurringInvoiceRequest,
  UpdateRecurringInvoiceRequest,
  FinExpenseCategory,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  FinExpense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  FinanceDashboardStats,
  AgingReport,
  FinanceCsvImportResult,
  FinEstimateVersion,
  FinActivity,
} from "./financeTypes";
import type { BaseResponse, PaginatedData } from "./types";

class FinanceService {
  private baseUrl = "/finance";

  private buildQuery(params: Record<string, unknown>): string {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        q.append(key, String(val));
      }
    });
    return q.toString();
  }

  // ─── Tax Rates ──────────────────────────────────────

  async getTaxRates(params: { page?: number; limit?: number; searchTerm?: string; type?: string; isActive?: boolean } = {}): Promise<BaseResponse<PaginatedData<FinTaxRate>>> {
    return apiService.get(`${this.baseUrl}/tax-rates?${this.buildQuery(params)}`);
  }

  async getTaxRate(id: string): Promise<BaseResponse<FinTaxRate>> {
    return apiService.get(`${this.baseUrl}/tax-rates/${id}`);
  }

  async createTaxRate(data: CreateTaxRateRequest): Promise<BaseResponse<FinTaxRate>> {
    return apiService.post(`${this.baseUrl}/tax-rates`, data);
  }

  async updateTaxRate(id: string, data: UpdateTaxRateRequest): Promise<BaseResponse<FinTaxRate>> {
    return apiService.patch(`${this.baseUrl}/tax-rates/${id}`, data);
  }

  async deleteTaxRate(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/tax-rates/${id}`);
  }

  // ─── Products ──────────────────────────────────────

  async getProducts(params: { page?: number; limit?: number; searchTerm?: string; type?: string; isActive?: boolean } = {}): Promise<BaseResponse<PaginatedData<FinProduct>>> {
    return apiService.get(`${this.baseUrl}/products?${this.buildQuery(params)}`);
  }

  async getProduct(id: string): Promise<BaseResponse<FinProduct>> {
    return apiService.get(`${this.baseUrl}/products/${id}`);
  }

  async createProduct(data: CreateProductRequest): Promise<BaseResponse<FinProduct>> {
    return apiService.post(`${this.baseUrl}/products`, data);
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<BaseResponse<FinProduct>> {
    return apiService.patch(`${this.baseUrl}/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/products/${id}`);
  }

  // ─── Vendors ──────────────────────────────────────

  async getVendors(params: { page?: number; limit?: number; searchTerm?: string; isActive?: boolean } = {}): Promise<BaseResponse<PaginatedData<FinVendor>>> {
    return apiService.get(`${this.baseUrl}/vendors?${this.buildQuery(params)}`);
  }

  async getVendor(id: string): Promise<BaseResponse<FinVendor>> {
    return apiService.get(`${this.baseUrl}/vendors/${id}`);
  }

  async createVendor(data: CreateVendorRequest): Promise<BaseResponse<FinVendor>> {
    return apiService.post(`${this.baseUrl}/vendors`, data);
  }

  async updateVendor(id: string, data: UpdateVendorRequest): Promise<BaseResponse<FinVendor>> {
    return apiService.patch(`${this.baseUrl}/vendors/${id}`, data);
  }

  async deleteVendor(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/vendors/${id}`);
  }

  // ─── Invoices ──────────────────────────────────────

  async getInvoices(params: { page?: number; limit?: number; searchTerm?: string; status?: string; crmCompanyId?: string; dateRange?: string; currency?: string } = {}): Promise<BaseResponse<PaginatedData<FinInvoice>>> {
    return apiService.get(`${this.baseUrl}/invoices?${this.buildQuery(params)}`);
  }

  async getInvoice(id: string): Promise<BaseResponse<FinInvoice>> {
    return apiService.get(`${this.baseUrl}/invoices/${id}`);
  }

  async createInvoice(data: CreateInvoiceRequest): Promise<BaseResponse<FinInvoice>> {
    return apiService.post(`${this.baseUrl}/invoices`, data);
  }

  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<BaseResponse<FinInvoice>> {
    return apiService.patch(`${this.baseUrl}/invoices/${id}`, data);
  }

  async deleteInvoice(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/invoices/${id}`);
  }

  async markInvoiceSent(id: string): Promise<BaseResponse<FinInvoice>> {
    return apiService.post(`${this.baseUrl}/invoices/${id}/mark-sent`, {});
  }

  async cancelInvoice(id: string): Promise<BaseResponse<FinInvoice>> {
    return apiService.post(`${this.baseUrl}/invoices/${id}/cancel`, {});
  }

  // ─── Invoice Payments ──────────────────────────────────

  async getInvoicePayments(invoiceId: string): Promise<BaseResponse<PaginatedData<FinInvoicePayment>>> {
    return apiService.get(`${this.baseUrl}/invoices/${invoiceId}/payments`);
  }

  async recordPayment(invoiceId: string, data: CreatePaymentRequest): Promise<BaseResponse<FinInvoicePayment>> {
    return apiService.post(`${this.baseUrl}/invoices/${invoiceId}/payments`, data);
  }

  async deletePayment(invoiceId: string, paymentId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/invoices/${invoiceId}/payments/${paymentId}`);
  }

  // ─── Estimates ──────────────────────────────────────

  async getEstimates(params: { page?: number; limit?: number; searchTerm?: string; status?: string; crmCompanyId?: string; dateRange?: string; currency?: string } = {}): Promise<BaseResponse<PaginatedData<FinEstimate>>> {
    return apiService.get(`${this.baseUrl}/estimates?${this.buildQuery(params)}`);
  }

  async getEstimate(id: string): Promise<BaseResponse<FinEstimate>> {
    return apiService.get(`${this.baseUrl}/estimates/${id}`);
  }

  async createEstimate(data: CreateEstimateRequest): Promise<BaseResponse<FinEstimate>> {
    return apiService.post(`${this.baseUrl}/estimates`, data);
  }

  async updateEstimate(id: string, data: UpdateEstimateRequest): Promise<BaseResponse<FinEstimate>> {
    return apiService.patch(`${this.baseUrl}/estimates/${id}`, data);
  }

  async deleteEstimate(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/estimates/${id}`);
  }

  async convertEstimateToInvoice(id: string): Promise<BaseResponse<FinInvoice>> {
    return apiService.post(`${this.baseUrl}/estimates/${id}/convert`, {});
  }

  async getEstimateVersions(id: string): Promise<BaseResponse<PaginatedData<FinEstimateVersion>>> {
    return apiService.get(`${this.baseUrl}/estimates/${id}/versions`);
  }

  async getEstimateVersion(id: string, version: number): Promise<BaseResponse<FinEstimateVersion>> {
    return apiService.get(`${this.baseUrl}/estimates/${id}/versions/${version}`);
  }

  // ─── Recurring Invoices ──────────────────────────────────

  async getRecurringInvoices(params: { page?: number; limit?: number; searchTerm?: string; frequency?: string; isActive?: boolean } = {}): Promise<BaseResponse<PaginatedData<FinRecurringInvoice>>> {
    return apiService.get(`${this.baseUrl}/recurring-invoices?${this.buildQuery(params)}`);
  }

  async getRecurringInvoice(id: string): Promise<BaseResponse<FinRecurringInvoice>> {
    return apiService.get(`${this.baseUrl}/recurring-invoices/${id}`);
  }

  async createRecurringInvoice(data: CreateRecurringInvoiceRequest): Promise<BaseResponse<FinRecurringInvoice>> {
    return apiService.post(`${this.baseUrl}/recurring-invoices`, data);
  }

  async updateRecurringInvoice(id: string, data: UpdateRecurringInvoiceRequest): Promise<BaseResponse<FinRecurringInvoice>> {
    return apiService.patch(`${this.baseUrl}/recurring-invoices/${id}`, data);
  }

  async deleteRecurringInvoice(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/recurring-invoices/${id}`);
  }

  // ─── Expense Categories ──────────────────────────────────

  async getExpenseCategories(params: { page?: number; limit?: number; searchTerm?: string; isActive?: boolean } = {}): Promise<BaseResponse<PaginatedData<FinExpenseCategory>>> {
    return apiService.get(`${this.baseUrl}/expense-categories?${this.buildQuery(params)}`);
  }

  async getExpenseCategory(id: string): Promise<BaseResponse<FinExpenseCategory>> {
    return apiService.get(`${this.baseUrl}/expense-categories/${id}`);
  }

  async createExpenseCategory(data: CreateExpenseCategoryRequest): Promise<BaseResponse<FinExpenseCategory>> {
    return apiService.post(`${this.baseUrl}/expense-categories`, data);
  }

  async updateExpenseCategory(id: string, data: UpdateExpenseCategoryRequest): Promise<BaseResponse<FinExpenseCategory>> {
    return apiService.patch(`${this.baseUrl}/expense-categories/${id}`, data);
  }

  async deleteExpenseCategory(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/expense-categories/${id}`);
  }

  // ─── Expenses ──────────────────────────────────────

  async getExpenses(params: { page?: number; limit?: number; searchTerm?: string; categoryId?: string; vendorId?: string; paymentMethod?: string; dateRange?: string; currency?: string } = {}): Promise<BaseResponse<PaginatedData<FinExpense>>> {
    return apiService.get(`${this.baseUrl}/expenses?${this.buildQuery(params)}`);
  }

  async getExpense(id: string): Promise<BaseResponse<FinExpense>> {
    return apiService.get(`${this.baseUrl}/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseRequest): Promise<BaseResponse<FinExpense>> {
    return apiService.post(`${this.baseUrl}/expenses`, data);
  }

  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<BaseResponse<FinExpense>> {
    return apiService.patch(`${this.baseUrl}/expenses/${id}`, data);
  }

  async deleteExpense(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/expenses/${id}`);
  }

  // ─── Dashboard & Reports ──────────────────────────────────

  async getDashboardStats(params: { period?: string; currency?: string } = {}): Promise<BaseResponse<FinanceDashboardStats>> {
    return apiService.get(`${this.baseUrl}/dashboard?${this.buildQuery(params)}`);
  }

  async getAgingReport(): Promise<BaseResponse<AgingReport>> {
    return apiService.get(`${this.baseUrl}/reports/aging`);
  }

  // ─── CSV Export ──────────────────────────────────────

  async exportProductsCsv(): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch(`${baseUrl}${this.baseUrl}/export/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportVendorsCsv(): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch(`${baseUrl}${this.baseUrl}/export/vendors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendors-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportInvoicesCsv(params: { status?: string; currency?: string } = {}): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const query = this.buildQuery(params);
    const response = await fetch(`${baseUrl}${this.baseUrl}/export/invoices?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportExpensesCsv(params: { categoryId?: string; vendorId?: string; currency?: string } = {}): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const query = this.buildQuery(params);
    const response = await fetch(`${baseUrl}${this.baseUrl}/export/expenses?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Email ──────────────────────────────────────

  async emailInvoice(id: string, data: { to: string; subject?: string; message?: string }): Promise<BaseResponse<{ message: string }>> {
    return apiService.post(`${this.baseUrl}/invoices/${id}/email`, data);
  }

  async emailEstimate(id: string, data: { to: string; subject?: string; message?: string }): Promise<BaseResponse<{ message: string }>> {
    return apiService.post(`${this.baseUrl}/estimates/${id}/email`, data);
  }

  // ─── Activities ──────────────────────────────────────

  async getActivities(params: { page?: number; limit?: number; entityType?: string } = {}): Promise<BaseResponse<PaginatedData<FinActivity>>> {
    return apiService.get(`${this.baseUrl}/activities?${this.buildQuery(params)}`);
  }

  // ─── PDF Download ──────────────────────────────────────

  async downloadEstimatePdf(id: string, filename?: string): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch(`${baseUrl}${this.baseUrl}/estimates/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to download PDF");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `estimate-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async downloadInvoicePdf(id: string, filename?: string): Promise<void> {
    const token = sessionStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch(`${baseUrl}${this.baseUrl}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to download PDF");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `invoice-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── CSV Import ──────────────────────────────────────

  async importVendors(file: File): Promise<BaseResponse<FinanceCsvImportResult>> {
    const rows = await this.parseCsvFile(file);
    return apiService.post(`${this.baseUrl}/import/vendors`, { data: JSON.stringify(rows) });
  }

  async importProducts(file: File): Promise<BaseResponse<FinanceCsvImportResult>> {
    const rows = await this.parseCsvFile(file);
    return apiService.post(`${this.baseUrl}/import/products`, { data: JSON.stringify(rows) });
  }

  async importExpenses(file: File): Promise<BaseResponse<FinanceCsvImportResult>> {
    const rows = await this.parseCsvFile(file);
    return apiService.post(`${this.baseUrl}/import/expenses`, { data: JSON.stringify(rows) });
  }

  private async parseCsvFile(file: File): Promise<Record<string, string>[]> {
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    });
  }
}

export const financeService = new FinanceService();
