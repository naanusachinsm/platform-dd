import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiDataFetcherService, FetchContext } from './ai-data-fetcher.service';
import { UserContextService } from '../services/user-context.service';

export interface AiChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  context?: FetchContext;
}

interface RouteResult {
  dataSources: string[];
  projectRef?: string;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly dataFetcher: AiDataFetcherService,
    private readonly userContextService: UserContextService,
  ) {}

  async chat(request: AiChatRequest): Promise<any> {
    const user = this.userContextService.getCurrentUser();
    const organizationId = user?.organizationId;
    const context: FetchContext = {
      ...request.context,
      organizationId,
    };

    this.logger.log(`[CHAT START] message="${request.message}", contextProjectId=${context.projectId || 'none'}, orgId=${organizationId}`);

    const route = await this.routeStep(request, context, organizationId);
    let { dataSources } = route;

    this.logger.log(`[ROUTE RESULT] dataSources=[${dataSources.join(', ')}], projectRef="${route.projectRef || 'none'}"`);

    if (!context.projectId && route.projectRef) {
      this.logger.log(`[RESOLVE] No projectId in context, resolving projectRef="${route.projectRef}"...`);
      const resolvedId = await this.resolveProjectByName(route.projectRef);
      if (resolvedId) {
        context.projectId = resolvedId;
        this.logger.log(`[RESOLVE OK] "${route.projectRef}" → projectId=${resolvedId}`);
      } else {
        this.logger.warn(`[RESOLVE FAIL] Could not find project matching "${route.projectRef}"`);
      }
    }

    if (!context.projectId && dataSources.some((k) => k.startsWith('project_') && k !== 'project_list')) {
      this.logger.warn(`[FALLBACK] No projectId available, stripping project-specific sources, adding project_list`);
      dataSources = ['project_list', ...dataSources.filter((k) => !k.startsWith('project_') || k === 'project_list')];
    }

    this.logger.log(`[FETCH] Fetching ${dataSources.length} source(s) with projectId=${context.projectId || 'none'}: [${dataSources.join(', ')}]`);

    const fetchedData = dataSources.length > 0
      ? await this.dataFetcher.fetch(dataSources, context)
      : {};

    const fetchKeys = Object.keys(fetchedData);
    for (const key of fetchKeys) {
      const val = fetchedData[key];
      const hasError = val?.error || val?.note;
      const summary = hasError
        ? `ERROR: ${val.error || val.note}`
        : `OK (${JSON.stringify(val).length} chars)`;
      this.logger.log(`[FETCH RESULT] ${key} → ${summary}`);
    }

    this.logger.log(`[ANALYSIS] Sending to LLM with ${fetchKeys.length} data source(s)...`);
    const result = await this.analysisStep(request, fetchedData, organizationId);
    this.logger.log(`[CHAT DONE] Response length=${JSON.stringify(result).length} chars`);

    return result;
  }

  private async routeStep(request: AiChatRequest, context: FetchContext, organizationId: string): Promise<RouteResult> {
    const catalog = this.dataFetcher.getCatalogPrompt();

    const contextHint = context.projectId
      ? `\nIMPORTANT: The user is currently viewing a project (projectId is available). You can use any project_* data source.`
      : '';

    const messages = [
      ...(request.conversationHistory || []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: request.message },
    ];

    try {
      const result = await this.aiService.chatJson<RouteResult>({
        systemPrompt: `You are a data routing assistant. Given a user question and conversation context, decide which data sources to fetch.

${catalog}
${contextHint}

Rules:
- Return a JSON object with:
  - "dataSources": array of source keys needed (max 5)
  - "projectRef": if the user mentions a project by name or key, include it here (e.g. "kidat", "KIDAT"). Otherwise omit this field.
- Only include sources that are directly relevant to answering the question.
- If the user mentions a specific project by name, ALWAYS include the relevant project sources AND set projectRef.
- If projectId is available (see above), include project sources when the user asks about tickets, sprints, members, etc.
- Consider the conversation history when determining intent. Short follow-ups like "all", "show me", "details" refer to the previous topic.
- If the question is a greeting or general conversation with no data need, return dataSources as an empty array.`,
        messages,
      }, organizationId);

      this.logger.log(`[ROUTE RAW] LLM returned: ${JSON.stringify(result)}`);

      const validKeys = new Set([
        'project_list', 'project_summary', 'project_tickets', 'project_sprints',
        'project_members', 'project_activity', 'project_backlog',
        'crm_companies', 'crm_contacts', 'crm_deals', 'crm_pipeline', 'crm_dashboard',
        'employees_list', 'organizations_list', 'analytics_kpis', 'audit_logs', 'notifications_unread',
      ]);

      return {
        dataSources: (result.dataSources || []).filter((k: string) => validKeys.has(k)).slice(0, 5),
        projectRef: result.projectRef,
      };
    } catch (error) {
      this.logger.error(`[ROUTE ERROR] ${(error as Error).message}`);
      return { dataSources: [] };
    }
  }

  private async resolveProjectByName(nameOrKey: string): Promise<string | null> {
    try {
      this.logger.log(`[RESOLVE] Fetching project_list to find "${nameOrKey}"...`);
      const projects = await this.dataFetcher.fetch(['project_list'], {});
      const list = projects.project_list;

      this.logger.log(`[RESOLVE] project_list result type=${typeof list}, keys=${list ? Object.keys(list).join(',') : 'null'}`);

      if (!list) return null;

      const items = list.data || list;
      if (!Array.isArray(items)) {
        this.logger.warn(`[RESOLVE] project_list items is not an array: ${typeof items}`);
        return null;
      }

      this.logger.log(`[RESOLVE] Found ${items.length} project(s): ${items.map((p: any) => `${p.name}(${p.key})[${p.id}]`).join(', ')}`);

      const search = nameOrKey.toLowerCase();
      const match = items.find((p: any) =>
        p.name?.toLowerCase() === search ||
        p.key?.toLowerCase() === search,
      );

      if (match) {
        this.logger.log(`[RESOLVE] Matched: name="${match.name}", key="${match.key}", id="${match.id}"`);
      } else {
        this.logger.warn(`[RESOLVE] No match found for "${nameOrKey}" in ${items.length} projects`);
      }

      return match?.id || null;
    } catch (error) {
      this.logger.error(`[RESOLVE ERROR] ${(error as Error).message}`);
      return null;
    }
  }

  private async analysisStep(
    request: AiChatRequest,
    fetchedData: Record<string, any>,
    organizationId: string,
  ): Promise<any> {
    const dataContext = Object.keys(fetchedData).length > 0
      ? `\n\nFetched data:\n${JSON.stringify(fetchedData, null, 2)}`
      : '';

    const messages = [
      ...(request.conversationHistory || []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: request.message },
    ];

    return this.aiService.chatJson({
      systemPrompt: `You are a helpful AI assistant for a business management platform. You have access to real-time data from the application.${dataContext}

Rules for your response:
- Be concise and conversational. Do NOT dump raw data fields, timestamps, UUIDs, or email addresses.
- Present information in a clean, human-readable way. Use names (not IDs), relative dates (e.g. "yesterday", "2 days ago"), and short summaries.
- Use simple formatting: bold for names/emphasis, bullet points for lists, and tables only when comparing multiple items.
- If listing items, show only the most relevant fields (e.g. ticket key, title, status, assignee — not createdBy, updatedAt, etc.).
- Answer directly. Don't repeat the question or add unnecessary preamble.
- NEVER say "I can't access" or "select a project" — you have full API access. If you have the data, use it.

Return a JSON object with:
- response: your answer as a string (clean, human-readable, no raw data dumps)
- suggestedActions: optional array of suggested follow-up actions (max 3), each with: type (string), label (string), payload (object). Only include if directly relevant.`,
      messages,
    }, organizationId);
  }
}
