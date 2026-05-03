import { apiService } from "./apiService";
import type {
  RbacResource,
  CreateResourceRequest,
  UpdateResourceRequest,
  GetResourcesParams,
} from "./resourceTypes";
import type { BaseResponse, PaginatedData } from "./types";

class ResourceService {
  private readonly baseUrl = "/rbac/resources";

  async getResources(
    params: GetResourcesParams = {}
  ): Promise<BaseResponse<PaginatedData<RbacResource>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    return apiService.get(url);
  }

  async getResource(id: string): Promise<BaseResponse<RbacResource>> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createResource(
    data: CreateResourceRequest
  ): Promise<BaseResponse<RbacResource>> {
    return apiService.post(this.baseUrl, data);
  }

  async updateResource(
    id: string,
    data: UpdateResourceRequest
  ): Promise<BaseResponse<RbacResource>> {
    return apiService.put(`${this.baseUrl}/${id}`, data);
  }
}

export const resourceService = new ResourceService();
