// Department
export const HrDepartmentStatus = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;
export type HrDepartmentStatus = (typeof HrDepartmentStatus)[keyof typeof HrDepartmentStatus];

export interface HrDepartment {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  headUserId?: string;
  parentDepartmentId?: string;
  status: HrDepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrDepartmentRequest {
  name: string;
  description?: string;
  headUserId?: string;
  parentDepartmentId?: string;
  status?: HrDepartmentStatus;
}
export type UpdateHrDepartmentRequest = Partial<CreateHrDepartmentRequest>;

// Designation
export const HrDesignationStatus = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;
export type HrDesignationStatus = (typeof HrDesignationStatus)[keyof typeof HrDesignationStatus];

export interface HrDesignation {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  departmentId?: string;
  level?: number;
  status: HrDesignationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrDesignationRequest {
  name: string;
  description?: string;
  departmentId?: string;
  level?: number;
  status?: HrDesignationStatus;
}
export type UpdateHrDesignationRequest = Partial<CreateHrDesignationRequest>;

// Leave Type
export const HrLeaveTypeStatus = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;
export type HrLeaveTypeStatus = (typeof HrLeaveTypeStatus)[keyof typeof HrLeaveTypeStatus];

export interface HrLeaveType {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string;
  defaultDays: number;
  carryForward: boolean;
  isPaid: boolean;
  status: HrLeaveTypeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrLeaveTypeRequest {
  name: string;
  description?: string;
  defaultDays?: number;
  carryForward?: boolean;
  isPaid?: boolean;
  status?: HrLeaveTypeStatus;
}
export type UpdateHrLeaveTypeRequest = Partial<CreateHrLeaveTypeRequest>;

// Leave Request
export const HrLeaveRequestStatus = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED", CANCELLED: "CANCELLED" } as const;
export type HrLeaveRequestStatus = (typeof HrLeaveRequestStatus)[keyof typeof HrLeaveRequestStatus];

export interface HrLeaveRequest {
  id: string;
  organizationId: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: HrLeaveRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrLeaveRequestRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
}
export interface UpdateHrLeaveRequestRequest {
  status?: HrLeaveRequestStatus;
  remarks?: string;
  startDate?: string;
  endDate?: string;
  daysCount?: number;
  reason?: string;
}

// Leave Balance
export interface HrLeaveBalance {
  id: string;
  organizationId: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrLeaveBalanceRequest {
  userId: string;
  leaveTypeId: string;
  year: number;
  totalDays?: number;
  usedDays?: number;
  remainingDays?: number;
}

// Attendance
export const HrAttendanceStatus = { PRESENT: "PRESENT", ABSENT: "ABSENT", HALF_DAY: "HALF_DAY", LATE: "LATE", ON_LEAVE: "ON_LEAVE" } as const;
export type HrAttendanceStatus = (typeof HrAttendanceStatus)[keyof typeof HrAttendanceStatus];

export interface HrAttendance {
  id: string;
  organizationId: string;
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: HrAttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrAttendanceRequest {
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  status?: HrAttendanceStatus;
  notes?: string;
}
export type UpdateHrAttendanceRequest = Partial<CreateHrAttendanceRequest>;

// Payroll
export const HrPayrollStatus = { DRAFT: "DRAFT", PROCESSED: "PROCESSED", PAID: "PAID" } as const;
export type HrPayrollStatus = (typeof HrPayrollStatus)[keyof typeof HrPayrollStatus];

export interface HrPayroll {
  id: string;
  organizationId: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  grossSalary: number;
  netSalary: number;
  status: HrPayrollStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrPayrollRequest {
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  grossSalary?: number;
  netSalary?: number;
  status?: HrPayrollStatus;
}
export type UpdateHrPayrollRequest = Partial<CreateHrPayrollRequest>;

// Announcement
export const HrAnnouncementType = { GENERAL: "GENERAL", POLICY: "POLICY", EVENT: "EVENT", HOLIDAY: "HOLIDAY" } as const;
export type HrAnnouncementType = (typeof HrAnnouncementType)[keyof typeof HrAnnouncementType];

export const HrAnnouncementPriority = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } as const;
export type HrAnnouncementPriority = (typeof HrAnnouncementPriority)[keyof typeof HrAnnouncementPriority];

export const HrAnnouncementStatus = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } as const;
export type HrAnnouncementStatus = (typeof HrAnnouncementStatus)[keyof typeof HrAnnouncementStatus];

export interface HrAnnouncement {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  type: HrAnnouncementType;
  priority: HrAnnouncementPriority;
  publishedAt?: string;
  expiresAt?: string;
  isPinned: boolean;
  status: HrAnnouncementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrAnnouncementRequest {
  title: string;
  content: string;
  type?: HrAnnouncementType;
  priority?: HrAnnouncementPriority;
  publishedAt?: string;
  expiresAt?: string;
  isPinned?: boolean;
  status?: HrAnnouncementStatus;
}
export type UpdateHrAnnouncementRequest = Partial<CreateHrAnnouncementRequest>;

// Document
export const HrDocumentType = { OFFER_LETTER: "OFFER_LETTER", ID_PROOF: "ID_PROOF", RESUME: "RESUME", CONTRACT: "CONTRACT", CERTIFICATE: "CERTIFICATE", OTHER: "OTHER" } as const;
export type HrDocumentType = (typeof HrDocumentType)[keyof typeof HrDocumentType];

export const HrDocumentStatus = { ACTIVE: "ACTIVE", ARCHIVED: "ARCHIVED" } as const;
export type HrDocumentStatus = (typeof HrDocumentStatus)[keyof typeof HrDocumentStatus];

export interface HrDocument {
  id: string;
  organizationId: string;
  userId?: string | null;
  title: string;
  documentType: HrDocumentType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  isPublic: boolean;
  status: HrDocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrDocumentRequest {
  userId?: string;
  isPublic?: boolean;
  title: string;
  documentType?: HrDocumentType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  status?: HrDocumentStatus;
}
export type UpdateHrDocumentRequest = Partial<CreateHrDocumentRequest>;

// Query params interfaces
export interface GetHrListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetHrLeaveRequestsParams extends GetHrListParams {
  userId?: string;
  leaveTypeId?: string;
}

export interface GetHrAttendanceParams extends GetHrListParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetHrPayrollParams extends GetHrListParams {
  userId?: string;
  month?: number;
  year?: number;
}

export interface GetHrDocumentParams extends GetHrListParams {
  userId?: string;
  documentType?: HrDocumentType;
}

export interface GetHrDesignationParams extends GetHrListParams {
  departmentId?: string;
}

export interface GetHrAnnouncementParams extends GetHrListParams {
  type?: HrAnnouncementType;
  priority?: HrAnnouncementPriority;
}

export interface GetHrLeaveBalanceParams {
  page?: number;
  limit?: number;
  userId?: string;
  leaveTypeId?: string;
  year?: number;
}

// Dashboard stats
export interface HrDashboardStats {
  totalDepartments: number;
  totalUsers: number;
  pendingLeaveRequests: number;
  todaysAttendanceCount: number;
  activeAnnouncements: number;
}

// Label and Color maps
export const HrDepartmentStatusLabels: Record<HrDepartmentStatus, string> = {
  ACTIVE: "Active", INACTIVE: "Inactive",
};
export const HrDepartmentStatusColors: Record<HrDepartmentStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50", INACTIVE: "text-gray-600 bg-gray-50",
};

export const HrDesignationStatusLabels: Record<HrDesignationStatus, string> = {
  ACTIVE: "Active", INACTIVE: "Inactive",
};
export const HrDesignationStatusColors: Record<HrDesignationStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50", INACTIVE: "text-gray-600 bg-gray-50",
};

export const HrLeaveTypeStatusLabels: Record<HrLeaveTypeStatus, string> = {
  ACTIVE: "Active", INACTIVE: "Inactive",
};
export const HrLeaveTypeStatusColors: Record<HrLeaveTypeStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50", INACTIVE: "text-gray-600 bg-gray-50",
};

export const HrLeaveRequestStatusLabels: Record<HrLeaveRequestStatus, string> = {
  PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled",
};
export const HrLeaveRequestStatusColors: Record<HrLeaveRequestStatus, string> = {
  PENDING: "text-yellow-600 bg-yellow-50", APPROVED: "text-green-600 bg-green-50",
  REJECTED: "text-red-600 bg-red-50", CANCELLED: "text-gray-600 bg-gray-50",
};

export const HrAttendanceStatusLabels: Record<HrAttendanceStatus, string> = {
  PRESENT: "Present", ABSENT: "Absent", HALF_DAY: "Half Day", LATE: "Late", ON_LEAVE: "On Leave",
};
export const HrAttendanceStatusColors: Record<HrAttendanceStatus, string> = {
  PRESENT: "text-green-600 bg-green-50", ABSENT: "text-red-600 bg-red-50",
  HALF_DAY: "text-orange-600 bg-orange-50", LATE: "text-yellow-600 bg-yellow-50",
  ON_LEAVE: "text-blue-600 bg-blue-50",
};

export const HrPayrollStatusLabels: Record<HrPayrollStatus, string> = {
  DRAFT: "Draft", PROCESSED: "Processed", PAID: "Paid",
};
export const HrPayrollStatusColors: Record<HrPayrollStatus, string> = {
  DRAFT: "text-gray-600 bg-gray-50", PROCESSED: "text-blue-600 bg-blue-50",
  PAID: "text-green-600 bg-green-50",
};

export const HrAnnouncementStatusLabels: Record<HrAnnouncementStatus, string> = {
  DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived",
};
export const HrAnnouncementStatusColors: Record<HrAnnouncementStatus, string> = {
  DRAFT: "text-gray-600 bg-gray-50", PUBLISHED: "text-green-600 bg-green-50",
  ARCHIVED: "text-yellow-600 bg-yellow-50",
};

export const HrAnnouncementTypeLabels: Record<HrAnnouncementType, string> = {
  GENERAL: "General", POLICY: "Policy", EVENT: "Event", HOLIDAY: "Holiday",
};

export const HrAnnouncementPriorityLabels: Record<HrAnnouncementPriority, string> = {
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
};
export const HrAnnouncementPriorityColors: Record<HrAnnouncementPriority, string> = {
  LOW: "text-gray-600 bg-gray-50", MEDIUM: "text-blue-600 bg-blue-50",
  HIGH: "text-orange-600 bg-orange-50", URGENT: "text-red-600 bg-red-50",
};

export const HrDocumentTypeLabels: Record<HrDocumentType, string> = {
  OFFER_LETTER: "Offer Letter", ID_PROOF: "ID Proof", RESUME: "Resume",
  CONTRACT: "Contract", CERTIFICATE: "Certificate", OTHER: "Other",
};

export const HrDocumentStatusLabels: Record<HrDocumentStatus, string> = {
  ACTIVE: "Active", ARCHIVED: "Archived",
};
export const HrDocumentStatusColors: Record<HrDocumentStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50", ARCHIVED: "text-gray-600 bg-gray-50",
};
