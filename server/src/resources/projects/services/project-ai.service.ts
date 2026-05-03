import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { AiService } from 'src/common/ai/ai.service';
import { AiChatService } from 'src/common/ai/ai-chat.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { TicketService } from './ticket.service';
import { SprintService } from './sprint.service';
import { TicketCommentService } from './ticket-comment.service';
import { ProjectActivityService } from './project-activity.service';
import { TicketRepository } from '../ticket.repository';
import { SprintRepository } from '../sprint.repository';
import { ProjectMemberRepository } from '../project-member.repository';
import { TicketType } from '../entities/ticket.entity';
import { AiEnhanceTicketDto } from '../dto/ai-enhance-ticket.dto';
import { AiParseTicketDto } from '../dto/ai-parse-ticket.dto';
import { AiDetectDuplicatesDto } from '../dto/ai-detect-duplicates.dto';
import { AiChatDto } from '../dto/ai-chat.dto';
import { User } from 'src/resources/users/entities/user.entity';
import { BoardColumn } from '../entities/board-column.entity';
import { Sprint } from '../entities/sprint.entity';
import { Ticket } from '../entities/ticket.entity';

@Injectable()
export class ProjectAiService {
  private readonly logger = new Logger(ProjectAiService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly aiChatService: AiChatService,
    private readonly userContextService: UserContextService,
    private readonly ticketService: TicketService,
    private readonly sprintService: SprintService,
    private readonly ticketCommentService: TicketCommentService,
    private readonly projectActivityService: ProjectActivityService,
    private readonly ticketRepository: TicketRepository,
    private readonly sprintRepository: SprintRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
  ) {}

  private getOrganizationId(): string {
    return this.userContextService.getCurrentUser()?.organizationId;
  }

  // ─── Ticket Enhancement ─────────────────────────────────

  async enhanceTicket(projectId: string, dto: AiEnhanceTicketDto) {
    const orgId = this.getOrganizationId();

    return this.aiService.chatJson({
      systemPrompt: `You are a project management assistant. Given a ticket title and optional description, suggest improvements.
Return a JSON object with:
- suggestedType: one of EPIC, STORY, TASK, BUG
- suggestedPriority: one of HIGHEST, HIGH, MEDIUM, LOW, LOWEST
- suggestedLabels: array of 1-3 relevant short labels (e.g. "frontend", "api", "performance", "security", "ux")
- suggestedStoryPoints: one of 1, 2, 3, 5, 8, 13
- improvedDescription: an improved, more detailed description (2-4 sentences)
Base your suggestions on the content of the title and description.`,
      messages: [
        {
          role: 'user',
          content: `Title: ${dto.title}\nDescription: ${dto.description || 'None provided'}`,
        },
      ],
    }, orgId);
  }

  // ─── Natural Language Ticket ────────────────────────────

  async parseTicketFromText(projectId: string, dto: AiParseTicketDto) {
    const orgId = this.getOrganizationId();

    return this.aiService.chatJson({
      systemPrompt: `You are a project management assistant. Parse free-form text into a structured ticket.
Return a JSON object with:
- title: a clear, concise ticket title (max 100 chars)
- description: a detailed description of the work
- type: one of EPIC, STORY, TASK, BUG (infer from context)
- priority: one of HIGHEST, HIGH, MEDIUM, LOW, LOWEST (infer from urgency words)
- labels: array of 1-3 relevant short labels
- storyPoints: one of 1, 2, 3, 5, 8, 13 (estimate complexity)`,
      messages: [
        {
          role: 'user',
          content: `Parse this into a structured ticket:\n\n"${dto.text}"`,
        },
      ],
    }, orgId);
  }

  // ─── Duplicate Detection ────────────────────────────────

  async detectDuplicates(projectId: string, dto: AiDetectDuplicatesDto) {
    const orgId = this.getOrganizationId();

    const existingTickets = await this.ticketRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 200, sortBy: 'createdAt', sortOrder: 'DESC' },
    });

    if (!existingTickets.data.length) {
      return { duplicates: [] };
    }

    const ticketSummaries = (existingTickets.data as any[]).map((t) => ({
      id: t.id,
      ticketKey: t.ticketKey,
      title: t.title,
      type: t.type,
    }));

    return this.aiService.chatJson({
      systemPrompt: `You are a duplicate ticket detector. Compare a new ticket against existing tickets.
Return a JSON object with a "duplicates" array. Each entry must have:
- ticketId: the id of the similar ticket
- ticketKey: the key of the similar ticket
- title: the title of the similar ticket
- similarity: a number 0-100 indicating how similar it is
- reason: a brief explanation of why it's similar
Only include tickets with similarity >= 50. Return an empty array if no duplicates found. Maximum 5 results.`,
      messages: [
        {
          role: 'user',
          content: `New ticket:\nTitle: ${dto.title}\nDescription: ${dto.description || 'None'}\n\nExisting tickets:\n${JSON.stringify(ticketSummaries)}`,
        },
      ],
    }, orgId);
  }

  // ─── Comment Summarization ──────────────────────────────

  async summarizeComments(projectId: string, ticketId: string) {
    const orgId = this.getOrganizationId();

    const comments = await this.ticketCommentService.findAll(projectId, ticketId);
    const commentData = (comments as any).data || comments;

    if (!commentData?.length) {
      return {
        summary: 'No comments to summarize.',
        keyDecisions: [],
        openQuestions: [],
        actionItems: [],
      };
    }

    const commentTexts = commentData.map((c: any) => {
      const authorName = c.author
        ? `${c.author.firstName ?? ''} ${c.author.lastName ?? ''}`.trim()
        : 'Unknown';
      return `[${authorName}]: ${c.content}`;
    });

    return this.aiService.chatJson({
      systemPrompt: `You are a project management assistant. Summarize a ticket's comment thread.
Return a JSON object with:
- summary: a concise summary of the discussion (2-4 sentences)
- keyDecisions: array of key decisions made (strings)
- openQuestions: array of unresolved questions (strings)
- actionItems: array of action items mentioned (strings)
If a category has no items, return an empty array.`,
      messages: [
        {
          role: 'user',
          content: `Summarize this comment thread:\n\n${commentTexts.join('\n\n')}`,
        },
      ],
    }, orgId);
  }

  // ─── Epic Decomposition (synchronous) ───────────────────

  async decomposeEpic(projectId: string, ticketId: string) {
    const orgId = this.getOrganizationId();
    const ticket = await this.ticketService.findOne(projectId, ticketId) as any;

    if (ticket.type !== TicketType.EPIC) {
      throw new BadRequestException('Only EPIC tickets can be decomposed');
    }

    const existingChildren = (ticket.children || []).map((c: any) => ({
      ticketKey: c.ticketKey,
      title: c.title,
      type: c.type,
    }));

    const childrenContext = existingChildren.length
      ? `\nExisting child tickets (do NOT duplicate these):\n${existingChildren.map((c: any) => `- ${c.ticketKey}: ${c.title} (${c.type})`).join('\n')}`
      : '';

    return this.aiService.chatJson({
      systemPrompt: `You are a project management AI assistant. Break down epics into actionable stories and tasks.
Return a JSON object with a "tickets" array. Each ticket must have: title, description, type (STORY or TASK), priority (HIGHEST, HIGH, MEDIUM, LOW, LOWEST), and storyPoints (1, 2, 3, 5, 8, 13).
Generate 3-8 child tickets that together cover the full scope of the epic. Be specific and actionable.`,
      messages: [
        {
          role: 'user',
          content: `Decompose this epic into stories/tasks:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description || 'No description provided'}${childrenContext}`,
        },
      ],
    }, orgId);
  }

  // ─── Sprint Insights (synchronous) ──────────────────────

  async getSprintInsights(projectId: string, sprintId: string) {
    const orgId = this.getOrganizationId();

    const sprint = await this.sprintRepository.findById(sprintId) as any;
    if (!sprint) throw new NotFoundException('Sprint not found');

    const tickets = await this.ticketRepository.findAll({
      where: { projectId, sprintId } as any,
      pagination: { page: 1, limit: 500 },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name'] },
      ],
    });

    const ticketSummaries = (tickets.data as any[]).map((t) => ({
      ticketKey: t.ticketKey,
      title: t.title,
      type: t.type,
      priority: t.priority,
      status: t.column?.name,
      assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned',
      storyPoints: t.storyPoints,
      resolution: t.resolution,
    }));

    const sprintData = {
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalTickets: ticketSummaries.length,
      tickets: ticketSummaries,
    };

    return this.aiService.chatJson({
      systemPrompt: `You are a project management AI assistant specialized in agile retrospectives.
Analyze the sprint data and return a JSON object with: summary (string), wentWell (string[]), improvements (string[]), bottlenecks (string[]), velocityAnalysis (string), recommendations (string[]).
Be specific and reference actual ticket data when possible.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this sprint and provide insights:\n\n${JSON.stringify(sprintData, null, 2)}`,
        },
      ],
    }, orgId);
  }

  // ─── Risk Analysis (synchronous) ────────────────────────

  async analyzeRisks(projectId: string) {
    const orgId = this.getOrganizationId();
    const summary = await this.ticketService.getProjectSummary(projectId);

    const tickets = await this.ticketRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 500 },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: BoardColumn, as: 'column', attributes: ['id', 'name'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name', 'status'] },
      ],
    });

    const members = await this.projectMemberRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 100 },
      bypassTenantFilter: true,
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
    });

    const memberWorkload = new Map<string, { name: string; count: number }>();
    for (const t of tickets.data as any[]) {
      if (t.assignee) {
        const name = `${t.assignee.firstName} ${t.assignee.lastName}`;
        const existing = memberWorkload.get(t.assigneeId) || { name, count: 0 };
        existing.count++;
        memberWorkload.set(t.assigneeId, existing);
      }
    }

    const projectData = {
      summary,
      tickets: (tickets.data as any[]).map((t) => ({
        ticketKey: t.ticketKey,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.column?.name,
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : null,
        dueDate: t.dueDate,
        storyPoints: t.storyPoints,
        sprint: t.sprint?.name,
        updatedAt: t.updatedAt,
      })),
      memberWorkload: Array.from(memberWorkload.values()),
      totalMembers: members.total,
    };

    return this.aiService.chatJson({
      systemPrompt: `You are a project management AI assistant specialized in risk assessment.
Analyze the project data and return a JSON object with: risks (array of {level: "HIGH"|"MEDIUM"|"LOW", description: string}), bottlenecks (string[]), overloadedMembers (array of {name: string, ticketCount: number, reason: string}), staleTickets (array of {ticketKey: string, title: string, daysStale: number}), recommendations (string[]).
Be specific and reference actual data.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this project for risks and bottlenecks:\n\n${JSON.stringify(projectData, null, 2)}`,
        },
      ],
    }, orgId);
  }

  // ─── AI Chat Assistant ──────────────────────────────────

  async chat(projectId: string, dto: AiChatDto) {
    return this.aiChatService.chat({
      message: dto.message,
      conversationHistory: dto.conversationHistory,
      context: { projectId },
    });
  }
}
