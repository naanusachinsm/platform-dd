import { apiService } from "./apiService";
import type {
  CrmCompany,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CrmContact,
  CreateContactRequest,
  UpdateContactRequest,
  CrmDeal,
  CreateDealRequest,
  UpdateDealRequest,
  UpdateDealStageRequest,
  DealPipeline,
  CrmActivity,
  CreateActivityRequest,
  UpdateActivityRequest,
  CrmDashboardStats,
  CsvImportResult,
  CrmAuditActivity,
} from "./crmTypes";
import type { BaseResponse, PaginatedData } from "./types";

class CrmService {
  private baseUrl = "/crm";

  // ─── Companies ──────────────────────────────────────

  async getCompanies(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    status?: string;
    size?: string;
    industry?: string;
  } = {}): Promise<BaseResponse<PaginatedData<CrmCompany>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.searchTerm) q.append("searchTerm", params.searchTerm);
    if (params.status) q.append("status", params.status);
    if (params.size) q.append("size", params.size);
    if (params.industry) q.append("industry", params.industry);
    return apiService.get(`${this.baseUrl}/companies?${q.toString()}`);
  }

  async getCompany(id: string): Promise<BaseResponse<CrmCompany>> {
    return apiService.get(`${this.baseUrl}/companies/${id}`);
  }

  async createCompany(data: CreateCompanyRequest): Promise<BaseResponse<CrmCompany>> {
    return apiService.post(`${this.baseUrl}/companies`, data);
  }

  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<BaseResponse<CrmCompany>> {
    return apiService.patch(`${this.baseUrl}/companies/${id}`, data);
  }

  async deleteCompany(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/companies/${id}`);
  }

  // ─── Contacts ──────────────────────────────────────

  async getContacts(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    status?: string;
    source?: string;
    companyId?: string;
  } = {}): Promise<BaseResponse<PaginatedData<CrmContact>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.searchTerm) q.append("searchTerm", params.searchTerm);
    if (params.status) q.append("status", params.status);
    if (params.source) q.append("source", params.source);
    if (params.companyId) q.append("companyId", params.companyId);
    return apiService.get(`${this.baseUrl}/contacts?${q.toString()}`);
  }

  async getContact(id: string): Promise<BaseResponse<CrmContact>> {
    return apiService.get(`${this.baseUrl}/contacts/${id}`);
  }

  async createContact(data: CreateContactRequest): Promise<BaseResponse<CrmContact>> {
    return apiService.post(`${this.baseUrl}/contacts`, data);
  }

  async updateContact(id: string, data: UpdateContactRequest): Promise<BaseResponse<CrmContact>> {
    return apiService.patch(`${this.baseUrl}/contacts/${id}`, data);
  }

  async deleteContact(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/contacts/${id}`);
  }

  // ─── Deals ──────────────────────────────────────

  async getDeals(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    stage?: string;
    priority?: string;
    contactId?: string;
    companyId?: string;
    ownerId?: string;
    dateRange?: string;
  } = {}): Promise<BaseResponse<PaginatedData<CrmDeal>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.searchTerm) q.append("searchTerm", params.searchTerm);
    if (params.stage) q.append("stage", params.stage);
    if (params.priority) q.append("priority", params.priority);
    if (params.contactId) q.append("contactId", params.contactId);
    if (params.companyId) q.append("companyId", params.companyId);
    if (params.ownerId) q.append("ownerId", params.ownerId);
    if (params.dateRange && params.dateRange !== "all") q.append("dateRange", params.dateRange);
    return apiService.get(`${this.baseUrl}/deals?${q.toString()}`);
  }

  async getDeal(id: string): Promise<BaseResponse<CrmDeal>> {
    return apiService.get(`${this.baseUrl}/deals/${id}`);
  }

  async createDeal(data: CreateDealRequest): Promise<BaseResponse<CrmDeal>> {
    return apiService.post(`${this.baseUrl}/deals`, data);
  }

  async updateDeal(id: string, data: UpdateDealRequest): Promise<BaseResponse<CrmDeal>> {
    return apiService.patch(`${this.baseUrl}/deals/${id}`, data);
  }

  async updateDealStage(id: string, data: UpdateDealStageRequest): Promise<BaseResponse<CrmDeal>> {
    return apiService.patch(`${this.baseUrl}/deals/${id}/stage`, data);
  }

  async deleteDeal(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/deals/${id}`);
  }

  async getDealsPipeline(dateRange?: string): Promise<BaseResponse<DealPipeline>> {
    const q = new URLSearchParams();
    if (dateRange && dateRange !== "all") q.append("dateRange", dateRange);
    const qs = q.toString();
    return apiService.get(`${this.baseUrl}/deals/pipeline${qs ? `?${qs}` : ""}`);
  }

  // ─── Activities ──────────────────────────────────────

  async getActivities(params: {
    page?: number;
    limit?: number;
    contactId?: string;
    companyId?: string;
    dealId?: string;
    type?: string;
    status?: string;
  } = {}): Promise<BaseResponse<PaginatedData<CrmActivity>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.contactId) q.append("contactId", params.contactId);
    if (params.companyId) q.append("companyId", params.companyId);
    if (params.dealId) q.append("dealId", params.dealId);
    if (params.type) q.append("type", params.type);
    if (params.status) q.append("status", params.status);
    return apiService.get(`${this.baseUrl}/activities?${q.toString()}`);
  }

  async getActivity(id: string): Promise<BaseResponse<CrmActivity>> {
    return apiService.get(`${this.baseUrl}/activities/${id}`);
  }

  async createActivity(data: CreateActivityRequest): Promise<BaseResponse<CrmActivity>> {
    return apiService.post(`${this.baseUrl}/activities`, data);
  }

  async updateActivity(id: string, data: UpdateActivityRequest): Promise<BaseResponse<CrmActivity>> {
    return apiService.patch(`${this.baseUrl}/activities/${id}`, data);
  }

  async deleteActivity(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/activities/${id}`);
  }

  // ─── Dashboard ──────────────────────────────────────

  async getDashboardStats(): Promise<BaseResponse<CrmDashboardStats>> {
    return apiService.get(`${this.baseUrl}/dashboard`);
  }

  // ─── CSV Import ──────────────────────────────────────

  async importContacts(file: File): Promise<BaseResponse<CsvImportResult>> {
    const text = await file.text();
    const rows = this.parseCsv(text);
    return apiService.post(`${this.baseUrl}/import/contacts`, { data: JSON.stringify(rows) });
  }

  async importCompanies(file: File): Promise<BaseResponse<CsvImportResult>> {
    const text = await file.text();
    const rows = this.parseCsv(text);
    return apiService.post(`${this.baseUrl}/import/companies`, { data: JSON.stringify(rows) });
  }

  async getActivitiesLog(params: { page?: number; limit?: number; entityType?: string } = {}): Promise<BaseResponse<PaginatedData<CrmAuditActivity>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.entityType) q.append("entityType", params.entityType);
    return apiService.get(`${this.baseUrl}/activities-log?${q.toString()}`);
  }

  private parseCsv(content: string): Record<string, string>[] {
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

export const crmService = new CrmService();
