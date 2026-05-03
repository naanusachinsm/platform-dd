import { apiService } from "./apiService";
import type {
  Project,
  ProjectMember,
  Board,
  BoardColumn,
  Sprint,
  Ticket,
  BoardData,
  BacklogData,
  ProjectSummary,
  ProjectActivity,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateBoardRequest,
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateSprintRequest,
  MoveTicketRequest,
  TicketComment,
  ProjectAsset,
  AiEnhanceResult,
  AiParsedTicket,
  AiDuplicate,
  AiCommentSummary,
  AiChatResponse,
  AiJobStatus,
} from "./projectTypes";
import type { BaseResponse, PaginatedData } from "./types";

class ProjectService {
  private baseUrl = "/projects";

  // ─── Projects ──────────────────────────────────────

  async getProjects(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    status?: string;
  } = {}): Promise<BaseResponse<PaginatedData<Project>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.searchTerm) q.append("searchTerm", params.searchTerm);
    if (params.status) q.append("status", params.status);
    return apiService.get(`${this.baseUrl}?${q.toString()}`);
  }

  async getProject(id: string): Promise<BaseResponse<Project>> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async getProjectByKey(key: string): Promise<BaseResponse<Project>> {
    return apiService.get(`${this.baseUrl}/by-key/${key}`);
  }

  async createProject(data: CreateProjectRequest): Promise<BaseResponse<Project>> {
    return apiService.post(this.baseUrl, data);
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<BaseResponse<Project>> {
    return apiService.put(`${this.baseUrl}/${id}`, data);
  }

  async deleteProject(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  // ─── Members ───────────────────────────────────────

  async getMembers(projectId: string): Promise<BaseResponse<PaginatedData<ProjectMember>>> {
    return apiService.get(`${this.baseUrl}/${projectId}/members`);
  }

  async addMember(projectId: string, userId: string, role?: string): Promise<BaseResponse<ProjectMember>> {
    return apiService.post(`${this.baseUrl}/${projectId}/members`, { userId, role });
  }

  async removeMember(projectId: string, userId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/members/${userId}`);
  }

  // ─── Board Columns ────────────────────────────────

  async getColumns(): Promise<BaseResponse<PaginatedData<BoardColumn>>> {
    return apiService.get(`${this.baseUrl}/columns/list`);
  }

  async createColumn(name: string): Promise<BaseResponse<BoardColumn>> {
    return apiService.post(`${this.baseUrl}/columns`, { name });
  }

  async updateColumn(id: string, name: string): Promise<BaseResponse<BoardColumn>> {
    return apiService.put(`${this.baseUrl}/columns/${id}`, { name });
  }

  async reorderColumns(columnIds: string[]): Promise<BaseResponse<PaginatedData<BoardColumn>>> {
    return apiService.put(`${this.baseUrl}/columns/reorder`, { columnIds });
  }

  async deleteColumn(id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/columns/${id}`);
  }

  // ─── Sprints ──────────────────────────────────────

  async getSprints(projectId: string): Promise<BaseResponse<PaginatedData<Sprint>>> {
    return apiService.get(`${this.baseUrl}/${projectId}/sprints`);
  }

  async createSprint(projectId: string, data: CreateSprintRequest): Promise<BaseResponse<Sprint>> {
    return apiService.post(`${this.baseUrl}/${projectId}/sprints`, data);
  }

  async updateSprint(projectId: string, id: string, data: Partial<CreateSprintRequest>): Promise<BaseResponse<Sprint>> {
    return apiService.put(`${this.baseUrl}/${projectId}/sprints/${id}`, data);
  }

  async startSprint(projectId: string, id: string): Promise<BaseResponse<Sprint>> {
    return apiService.put(`${this.baseUrl}/${projectId}/sprints/${id}/start`, {});
  }

  async completeSprint(projectId: string, id: string): Promise<BaseResponse<Sprint>> {
    return apiService.put(`${this.baseUrl}/${projectId}/sprints/${id}/complete`, {});
  }

  async deleteSprint(projectId: string, id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/sprints/${id}`);
  }

  // ─── Tickets ──────────────────────────────────────

  async getTickets(projectId: string, params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    type?: string;
    priority?: string;
    assigneeId?: string;
    sprintId?: string;
    columnId?: string;
  } = {}): Promise<BaseResponse<PaginatedData<Ticket>>> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", params.page.toString());
    if (params.limit) q.append("limit", params.limit.toString());
    if (params.searchTerm) q.append("searchTerm", params.searchTerm);
    if (params.type) q.append("type", params.type);
    if (params.priority) q.append("priority", params.priority);
    if (params.assigneeId) q.append("assigneeId", params.assigneeId);
    if (params.sprintId) q.append("sprintId", params.sprintId);
    if (params.columnId) q.append("columnId", params.columnId);
    return apiService.get(`${this.baseUrl}/${projectId}/tickets?${q.toString()}`);
  }

  async getTicket(projectId: string, id: string): Promise<BaseResponse<Ticket>> {
    return apiService.get(`${this.baseUrl}/${projectId}/tickets/${id}`);
  }

  async getTicketByNumber(projectId: string, ticketNumber: number): Promise<BaseResponse<Ticket>> {
    return apiService.get(`${this.baseUrl}/${projectId}/tickets/by-number/${ticketNumber}`);
  }

  async createTicket(projectId: string, data: CreateTicketRequest): Promise<BaseResponse<Ticket>> {
    return apiService.post(`${this.baseUrl}/${projectId}/tickets`, data);
  }

  async updateTicket(projectId: string, id: string, data: UpdateTicketRequest): Promise<BaseResponse<Ticket>> {
    return apiService.put(`${this.baseUrl}/${projectId}/tickets/${id}`, data);
  }

  async deleteTicket(projectId: string, id: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/tickets/${id}`);
  }

  async moveTicket(projectId: string, id: string, data: MoveTicketRequest): Promise<BaseResponse<Ticket>> {
    return apiService.put(`${this.baseUrl}/${projectId}/tickets/${id}/move`, data);
  }

  async assignTicket(projectId: string, id: string, assigneeId?: string): Promise<BaseResponse<Ticket>> {
    return apiService.put(`${this.baseUrl}/${projectId}/tickets/${id}/assign`, { assigneeId });
  }

  // ─── Ticket Comments ────────────────────────────────

  async getComments(projectId: string, ticketId: string): Promise<BaseResponse<PaginatedData<TicketComment>>> {
    return apiService.get(`${this.baseUrl}/${projectId}/tickets/${ticketId}/comments`);
  }

  async createComment(projectId: string, ticketId: string, content: string): Promise<BaseResponse<TicketComment>> {
    return apiService.post(`${this.baseUrl}/${projectId}/tickets/${ticketId}/comments`, { content });
  }

  async updateComment(projectId: string, ticketId: string, commentId: string, content: string): Promise<BaseResponse<TicketComment>> {
    return apiService.put(`${this.baseUrl}/${projectId}/tickets/${ticketId}/comments/${commentId}`, { content });
  }

  async deleteComment(projectId: string, ticketId: string, commentId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/tickets/${ticketId}/comments/${commentId}`);
  }

  // ─── Boards ────────────────────────────────────────

  async getBoards(projectId: string): Promise<BaseResponse<PaginatedData<Board>>> {
    return apiService.get(`${this.baseUrl}/${projectId}/boards`);
  }

  async createBoard(projectId: string, data: CreateBoardRequest): Promise<BaseResponse<Board>> {
    return apiService.post(`${this.baseUrl}/${projectId}/boards`, data);
  }

  async updateBoard(projectId: string, boardId: string, data: Partial<CreateBoardRequest>): Promise<BaseResponse<Board>> {
    return apiService.put(`${this.baseUrl}/${projectId}/boards/${boardId}`, data);
  }

  async deleteBoard(projectId: string, boardId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/boards/${boardId}`);
  }

  async getBoardDataById(projectId: string, boardId: string): Promise<BaseResponse<BoardData>> {
    return apiService.get(`${this.baseUrl}/${projectId}/boards/${boardId}/data`);
  }

  // ─── Views ────────────────────────────────────────

  async getBoardData(projectId: string): Promise<BaseResponse<BoardData>> {
    return apiService.get(`${this.baseUrl}/${projectId}/board`);
  }

  async getBacklogData(projectId: string): Promise<BaseResponse<BacklogData>> {
    return apiService.get(`${this.baseUrl}/${projectId}/backlog`);
  }

  async getProjectSummary(projectId: string): Promise<BaseResponse<ProjectSummary>> {
    return apiService.get(`${this.baseUrl}/${projectId}/summary`);
  }

  async getProjectActivity(projectId: string, params?: { page?: number; limit?: number }): Promise<BaseResponse<{ data: ProjectActivity[]; total: number }>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    const qs = query.toString();
    return apiService.get(`${this.baseUrl}/${projectId}/activity${qs ? `?${qs}` : ""}`);
  }

  // ─── Project Assets ────────────────────────────────

  async getAssets(projectId: string): Promise<BaseResponse<PaginatedData<ProjectAsset>>> {
    return apiService.get(`${this.baseUrl}/${projectId}/assets`);
  }

  async uploadAndCreateAsset(projectId: string, file: File): Promise<BaseResponse<ProjectAsset>> {
    const formData = new FormData();
    formData.append("file", file);

    const token = sessionStorage.getItem("accessToken");
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    const uploadRes = await fetch(`${baseUrl}/upload/single`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.success || !uploadData.data?.files?.[0]) {
      return { success: false, message: uploadData.message || "Upload failed" } as any;
    }

    const uploaded = uploadData.data.files[0];
    return apiService.post(`${this.baseUrl}/${projectId}/assets`, {
      url: uploaded.url,
      filename: uploaded.filename,
      originalname: uploaded.originalname,
      mimetype: uploaded.mimetype,
      size: uploaded.size,
    });
  }

  async deleteAsset(projectId: string, assetId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${projectId}/assets/${assetId}`);
  }

  // ─── AI Features ──────────────────────────────────

  async aiEnhanceTicket(projectId: string, title: string, description?: string): Promise<BaseResponse<AiEnhanceResult>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/enhance-ticket`, { title, description });
  }

  async aiParseTicket(projectId: string, text: string): Promise<BaseResponse<AiParsedTicket>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/parse-ticket`, { text });
  }

  async aiDetectDuplicates(projectId: string, title: string, description?: string): Promise<BaseResponse<{ duplicates: AiDuplicate[] }>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/detect-duplicates`, { title, description });
  }

  async aiSummarizeComments(projectId: string, ticketId: string): Promise<BaseResponse<AiCommentSummary>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/summarize-comments/${ticketId}`, {});
  }

  async aiDecomposeEpic(projectId: string, ticketId: string): Promise<BaseResponse<{ jobId: string; message: string }>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/decompose/${ticketId}`, {});
  }

  async aiSprintInsights(projectId: string, sprintId: string): Promise<BaseResponse<{ jobId: string; message: string }>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/sprint-insights/${sprintId}`, {});
  }

  async aiRiskAnalysis(projectId: string): Promise<BaseResponse<{ jobId: string; message: string }>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/risk-analysis`, {});
  }

  async aiChat(projectId: string, message: string, conversationHistory?: Array<{ role: string; content: string }>): Promise<BaseResponse<AiChatResponse>> {
    return apiService.post(`${this.baseUrl}/${projectId}/ai/chat`, { message, conversationHistory });
  }

  async getAiJobStatus(projectId: string, jobId: string): Promise<BaseResponse<AiJobStatus>> {
    return apiService.get(`${this.baseUrl}/${projectId}/ai/job/${jobId}`);
  }

  async aiGlobalChat(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    projectId?: string,
  ): Promise<BaseResponse<AiChatResponse>> {
    return apiService.post('/ai/chat', { message, conversationHistory, projectId });
  }
}

export const projectService = new ProjectService();
