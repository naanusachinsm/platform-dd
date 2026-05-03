import { apiService } from "./apiService";
import type {
  HrDepartment,
  CreateHrDepartmentRequest,
  UpdateHrDepartmentRequest,
  HrDesignation,
  CreateHrDesignationRequest,
  UpdateHrDesignationRequest,
  HrLeaveType,
  CreateHrLeaveTypeRequest,
  UpdateHrLeaveTypeRequest,
  HrLeaveRequest,
  CreateHrLeaveRequestRequest,
  UpdateHrLeaveRequestRequest,
  HrLeaveBalance,
  CreateHrLeaveBalanceRequest,
  HrAttendance,
  CreateHrAttendanceRequest,
  UpdateHrAttendanceRequest,
  HrPayroll,
  CreateHrPayrollRequest,
  UpdateHrPayrollRequest,
  HrAnnouncement,
  CreateHrAnnouncementRequest,
  UpdateHrAnnouncementRequest,
  HrDocument,
  CreateHrDocumentRequest,
  UpdateHrDocumentRequest,
  HrDashboardStats,
  GetHrListParams,
  GetHrDesignationParams,
  GetHrLeaveRequestsParams,
  GetHrAttendanceParams,
  GetHrPayrollParams,
  GetHrDocumentParams,
  GetHrAnnouncementParams,
  GetHrLeaveBalanceParams,
} from "./hrTypes";
import type { BaseResponse, PaginatedData } from "./types";

class HrService {
  private baseUrl = "/hr";

  // ─── Departments ──────────────────────────────────────

  async getDepartments(
    params: GetHrListParams = {}
  ): Promise<BaseResponse<PaginatedData<HrDepartment>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/departments${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getDepartment(id: string): Promise<BaseResponse<HrDepartment>> {
    return apiService.get(`${this.baseUrl}/departments/${id}`);
  }

  async createDepartment(
    data: CreateHrDepartmentRequest
  ): Promise<BaseResponse<HrDepartment>> {
    return apiService.post(`${this.baseUrl}/departments`, data);
  }

  async updateDepartment(
    id: string,
    data: UpdateHrDepartmentRequest
  ): Promise<BaseResponse<HrDepartment>> {
    return apiService.patch(`${this.baseUrl}/departments/${id}`, data);
  }

  async deleteDepartment(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/departments/${id}`);
  }

  // ─── Designations ──────────────────────────────────────

  async getDesignations(
    params: GetHrDesignationParams = {}
  ): Promise<BaseResponse<PaginatedData<HrDesignation>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.departmentId) q.append("departmentId", params.departmentId);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/designations${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getDesignation(id: string): Promise<BaseResponse<HrDesignation>> {
    return apiService.get(`${this.baseUrl}/designations/${id}`);
  }

  async createDesignation(
    data: CreateHrDesignationRequest
  ): Promise<BaseResponse<HrDesignation>> {
    return apiService.post(`${this.baseUrl}/designations`, data);
  }

  async updateDesignation(
    id: string,
    data: UpdateHrDesignationRequest
  ): Promise<BaseResponse<HrDesignation>> {
    return apiService.patch(`${this.baseUrl}/designations/${id}`, data);
  }

  async deleteDesignation(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/designations/${id}`);
  }

  // ─── Leave Types ──────────────────────────────────────

  async getLeaveTypes(
    params: GetHrListParams = {}
  ): Promise<BaseResponse<PaginatedData<HrLeaveType>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/leave-types${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getLeaveType(id: string): Promise<BaseResponse<HrLeaveType>> {
    return apiService.get(`${this.baseUrl}/leave-types/${id}`);
  }

  async createLeaveType(
    data: CreateHrLeaveTypeRequest
  ): Promise<BaseResponse<HrLeaveType>> {
    return apiService.post(`${this.baseUrl}/leave-types`, data);
  }

  async updateLeaveType(
    id: string,
    data: UpdateHrLeaveTypeRequest
  ): Promise<BaseResponse<HrLeaveType>> {
    return apiService.patch(`${this.baseUrl}/leave-types/${id}`, data);
  }

  async deleteLeaveType(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/leave-types/${id}`);
  }

  // ─── Leave Requests ──────────────────────────────────────

  async getLeaveRequests(
    params: GetHrLeaveRequestsParams = {}
  ): Promise<BaseResponse<PaginatedData<HrLeaveRequest>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.userId) q.append("userId", params.userId);
    if (params.leaveTypeId) q.append("leaveTypeId", params.leaveTypeId);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/leave-requests${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getLeaveRequest(id: string): Promise<BaseResponse<HrLeaveRequest>> {
    return apiService.get(`${this.baseUrl}/leave-requests/${id}`);
  }

  async createLeaveRequest(
    data: CreateHrLeaveRequestRequest
  ): Promise<BaseResponse<HrLeaveRequest>> {
    return apiService.post(`${this.baseUrl}/leave-requests`, data);
  }

  async updateLeaveRequest(
    id: string,
    data: UpdateHrLeaveRequestRequest
  ): Promise<BaseResponse<HrLeaveRequest>> {
    return apiService.patch(`${this.baseUrl}/leave-requests/${id}`, data);
  }

  async deleteLeaveRequest(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/leave-requests/${id}`);
  }

  // ─── Leave Balances ──────────────────────────────────────

  async getLeaveBalances(
    params: GetHrLeaveBalanceParams = {}
  ): Promise<BaseResponse<PaginatedData<HrLeaveBalance>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.userId) q.append("userId", params.userId);
    if (params.leaveTypeId) q.append("leaveTypeId", params.leaveTypeId);
    if (params.year) q.append("year", params.year.toString());
    const url = `${this.baseUrl}/leave-balances${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async createLeaveBalance(
    data: CreateHrLeaveBalanceRequest
  ): Promise<BaseResponse<HrLeaveBalance>> {
    return apiService.post(`${this.baseUrl}/leave-balances`, data);
  }

  // ─── Attendance ──────────────────────────────────────

  async getAttendanceRecords(
    params: GetHrAttendanceParams = {}
  ): Promise<BaseResponse<PaginatedData<HrAttendance>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.userId) q.append("userId", params.userId);
    if (params.startDate) q.append("startDate", params.startDate);
    if (params.endDate) q.append("endDate", params.endDate);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/attendance${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getAttendance(id: string): Promise<BaseResponse<HrAttendance>> {
    return apiService.get(`${this.baseUrl}/attendance/${id}`);
  }

  async createAttendance(
    data: CreateHrAttendanceRequest
  ): Promise<BaseResponse<HrAttendance>> {
    return apiService.post(`${this.baseUrl}/attendance`, data);
  }

  async updateAttendance(
    id: string,
    data: UpdateHrAttendanceRequest
  ): Promise<BaseResponse<HrAttendance>> {
    return apiService.patch(`${this.baseUrl}/attendance/${id}`, data);
  }

  async deleteAttendance(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/attendance/${id}`);
  }

  // ─── Payroll ──────────────────────────────────────

  async getPayrollRecords(
    params: GetHrPayrollParams = {}
  ): Promise<BaseResponse<PaginatedData<HrPayroll>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.userId) q.append("userId", params.userId);
    if (params.month) q.append("month", params.month.toString());
    if (params.year) q.append("year", params.year.toString());
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/payroll${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getPayroll(id: string): Promise<BaseResponse<HrPayroll>> {
    return apiService.get(`${this.baseUrl}/payroll/${id}`);
  }

  async createPayroll(
    data: CreateHrPayrollRequest
  ): Promise<BaseResponse<HrPayroll>> {
    return apiService.post(`${this.baseUrl}/payroll`, data);
  }

  async updatePayroll(
    id: string,
    data: UpdateHrPayrollRequest
  ): Promise<BaseResponse<HrPayroll>> {
    return apiService.patch(`${this.baseUrl}/payroll/${id}`, data);
  }

  async deletePayroll(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/payroll/${id}`);
  }

  // ─── Announcements ──────────────────────────────────────

  async getAnnouncements(
    params: GetHrAnnouncementParams = {}
  ): Promise<BaseResponse<PaginatedData<HrAnnouncement>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.type) q.append("type", params.type);
    if (params.priority) q.append("priority", params.priority);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/announcements${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getAnnouncement(id: string): Promise<BaseResponse<HrAnnouncement>> {
    return apiService.get(`${this.baseUrl}/announcements/${id}`);
  }

  async createAnnouncement(
    data: CreateHrAnnouncementRequest
  ): Promise<BaseResponse<HrAnnouncement>> {
    return apiService.post(`${this.baseUrl}/announcements`, data);
  }

  async updateAnnouncement(
    id: string,
    data: UpdateHrAnnouncementRequest
  ): Promise<BaseResponse<HrAnnouncement>> {
    return apiService.patch(`${this.baseUrl}/announcements/${id}`, data);
  }

  async deleteAnnouncement(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/announcements/${id}`);
  }

  // ─── Documents ──────────────────────────────────────

  async getDocuments(
    params: GetHrDocumentParams = {}
  ): Promise<BaseResponse<PaginatedData<HrDocument>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.search) q.append("search", params.search);
    if (params.status) q.append("status", params.status);
    if (params.userId) q.append("userId", params.userId);
    if (params.documentType) q.append("documentType", params.documentType);
    if (params.sortBy) q.append("sortBy", params.sortBy);
    if (params.sortOrder) q.append("sortOrder", params.sortOrder);
    const url = `${this.baseUrl}/documents${q.toString() ? `?${q.toString()}` : ""}`;
    return apiService.get(url);
  }

  async getDocument(id: string): Promise<BaseResponse<HrDocument>> {
    return apiService.get(`${this.baseUrl}/documents/${id}`);
  }

  async createDocument(
    data: CreateHrDocumentRequest
  ): Promise<BaseResponse<HrDocument>> {
    return apiService.post(`${this.baseUrl}/documents`, data);
  }

  async updateDocument(
    id: string,
    data: UpdateHrDocumentRequest
  ): Promise<BaseResponse<HrDocument>> {
    return apiService.patch(`${this.baseUrl}/documents/${id}`, data);
  }

  async deleteDocument(
    id: string
  ): Promise<BaseResponse<{ message: string }>> {
    return apiService.delete(`${this.baseUrl}/documents/${id}`);
  }

  // ─── Dashboard ──────────────────────────────────────

  async getDashboardStats(): Promise<BaseResponse<HrDashboardStats>> {
    return apiService.get(`${this.baseUrl}/dashboard`);
  }
}

export const hrService = new HrService();
