export const ProjectStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const TicketType = {
  EPIC: "EPIC",
  STORY: "STORY",
  TASK: "TASK",
  BUG: "BUG",
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const TicketPriority = {
  HIGHEST: "HIGHEST",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  LOWEST: "LOWEST",
} as const;
export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketResolution = {
  UNRESOLVED: "UNRESOLVED",
  DONE: "DONE",
  WONT_DO: "WONT_DO",
  DUPLICATE: "DUPLICATE",
  CANNOT_REPRODUCE: "CANNOT_REPRODUCE",
} as const;
export type TicketResolution =
  (typeof TicketResolution)[keyof typeof TicketResolution];

export const SprintStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;
export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export const ProjectMemberRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type ProjectMemberRole =
  (typeof ProjectMemberRole)[keyof typeof ProjectMemberRole];

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  leadUserId?: string;
  ticketSequence: number;
  lead?: UserSummary;
  creator?: UserSummary;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  user?: UserSummary;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  organizationId: string;
  name: string;
  position: number;
  isDefault: boolean;
}

export interface Board {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  filterSprintId?: string;
  filterType?: string;
  filterPriority?: string;
  filterAssigneeId?: string;
  filterLabels?: string[];
  isDefault: boolean;
  position: number;
  createdAt: string;
}

export interface CreateBoardRequest {
  name: string;
  filterSprintId?: string;
  filterType?: string;
  filterPriority?: string;
  filterAssigneeId?: string;
  filterLabels?: string[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  createdAt: string;
}

export interface Ticket {
  id: string;
  organizationId: string;
  projectId: string;
  ticketKey: string;
  ticketNumber: number;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  columnId: string;
  assigneeId?: string;
  reporterId?: string;
  sprintId?: string;
  parentId?: string;
  resolution: TicketResolution;
  storyPoints?: number;
  dueDate?: string;
  labels?: string[];
  position: number;
  assignee?: UserSummary;
  reporter?: UserSummary;
  column?: { id: string; name: string; position: number };
  sprint?: { id: string; name: string; status: SprintStatus };
  project?: { id: string; name: string; key: string };
  parent?: { id: string; ticketKey: string; title: string };
  children?: Ticket[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  columns: (BoardColumn & { tickets: Ticket[] })[];
}

export interface BacklogData {
  backlog: Ticket[];
  totalBacklog: number;
}

export interface ProjectSummary {
  totalTickets: number;
  statusDistribution: { status: string; count: number }[];
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
  totalBoards: number;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  recentActivity: Ticket[];
}

export interface ProjectActivity {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  details?: Record<string, any>;
  createdAt: string;
  performedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string | null;
  };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  url: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  uploadedByUserId?: string;
  uploadedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  leadUserId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  leadUserId?: string;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  columnId?: string;
  assigneeId?: string;
  sprintId?: string;
  parentId?: string;
  storyPoints?: number;
  dueDate?: string;
  labels?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  columnId?: string;
  assigneeId?: string;
  sprintId?: string;
  parentId?: string;
  resolution?: TicketResolution;
  storyPoints?: number;
  dueDate?: string;
  labels?: string[];
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface MoveTicketRequest {
  columnId: string;
  position: number;
}

export const TicketTypeLabels: Record<TicketType, string> = {
  EPIC: "Epic",
  STORY: "Story",
  TASK: "Task",
  BUG: "Bug",
};

export const TicketPriorityLabels: Record<TicketPriority, string> = {
  HIGHEST: "Highest",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  LOWEST: "Lowest",
};

export const TicketResolutionLabels: Record<TicketResolution, string> = {
  UNRESOLVED: "Unresolved",
  DONE: "Done",
  WONT_DO: "Won't Do",
  DUPLICATE: "Duplicate",
  CANNOT_REPRODUCE: "Cannot Reproduce",
};

export const SprintStatusLabels: Record<SprintStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export const TicketTypeColors: Record<TicketType, string> = {
  EPIC: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  STORY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  TASK: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  BUG: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export const TicketPriorityColors: Record<TicketPriority, string> = {
  HIGHEST: "text-red-600",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-blue-500",
  LOWEST: "text-gray-400",
};

// ─── AI Types ──────────────────────────────────────

export interface AiEnhanceResult {
  suggestedType: TicketType;
  suggestedPriority: TicketPriority;
  suggestedLabels: string[];
  suggestedStoryPoints: number;
  improvedDescription: string;
}

export interface AiParsedTicket {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  labels: string[];
  storyPoints: number;
}

export interface AiDuplicate {
  ticketId: string;
  ticketKey: string;
  title: string;
  similarity: number;
  reason: string;
}

export interface AiCommentSummary {
  summary: string;
  keyDecisions: string[];
  openQuestions: string[];
  actionItems: string[];
}

export interface AiChatResponse {
  response: string;
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload: any;
  }>;
}

export interface AiJobStatus {
  jobId: string;
  state: string;
  progress: any;
  data: any;
  returnvalue: any;
  failedReason?: string;
}
