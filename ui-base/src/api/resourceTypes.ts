export interface RbacResource {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateResourceRequest {
  name: string;
  description?: string;
}

export interface UpdateResourceRequest {
  name: string;
  description?: string;
}

export interface GetResourcesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
