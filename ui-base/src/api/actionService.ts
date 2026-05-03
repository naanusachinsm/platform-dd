import { apiService } from "./apiService";
import type {
  RbacAction,
  CreateActionRequest,
  UpdateActionRequest,
  GetActionsParams,
} from "./actionTypes";
import type { BaseResponse, PaginatedData } from "./types";

class ActionService {
  private readonly baseUrl = "/rbac/actions";

  async getActions(
    params: GetActionsParams = {}
  ): Promise<BaseResponse<PaginatedData<RbacAction>>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    return apiService.get(url);
  }

  async getAction(id: string): Promise<BaseResponse<RbacAction>> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createAction(
    data: CreateActionRequest
  ): Promise<BaseResponse<RbacAction>> {
    return apiService.post(this.baseUrl, data);
  }

  async updateAction(
    id: string,
    data: UpdateActionRequest
  ): Promise<BaseResponse<RbacAction>> {
    return apiService.put(`${this.baseUrl}/${id}`, data);
  }
}

export const actionService = new ActionService();
