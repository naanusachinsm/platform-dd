export interface RbacAction {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateActionRequest {
  name: string;
  description?: string;
}

export interface UpdateActionRequest {
  name: string;
  description?: string;
}

export interface GetActionsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
