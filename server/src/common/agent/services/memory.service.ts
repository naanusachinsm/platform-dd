import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AgentUserMemory, UserMemoryCategory } from '../entities/agent-user-memory.entity';
import { AgentOrgMemory, OrgMemoryCategory } from '../entities/agent-org-memory.entity';
import { AiService } from 'src/common/ai/ai.service';
import { buildMemoryExtractionPrompt } from '../prompts/memory-extraction.prompt';
import { buildMemoryInjectionSection, MemoryForPrompt } from '../prompts/memory-injection.prompt';
import { ConversationMessage } from './conversation-store.service';

const RECENCY_DECAY_FACTOR = 0.1;
const STALE_DAYS = 90;
const MAX_USER_MEMORIES = 20;
const MAX_ORG_MEMORIES = 10;
const MAX_EXTRACT_USER = 5;
const MAX_EXTRACT_ORG = 3;

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectModel(AgentUserMemory)
    private readonly userMemoryModel: typeof AgentUserMemory,
    @InjectModel(AgentOrgMemory)
    private readonly orgMemoryModel: typeof AgentOrgMemory,
    private readonly aiService: AiService,
  ) {}

  async getUserMemories(
    userId: string,
    limit = MAX_USER_MEMORIES,
  ): Promise<AgentUserMemory[]> {
    const memories = await this.userMemoryModel.findAll({
      where: {
        userId,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
      order: [['relevanceScore', 'DESC']],
      limit: limit * 2,
    });

    const ranked = this.rankByRelevance(memories);
    const top = ranked.slice(0, limit);

    const ids = top.map((m) => m.id);
    if (ids.length > 0) {
      await this.userMemoryModel.update(
        { lastAccessedAt: new Date() },
        { where: { id: ids } },
      );
    }

    return top;
  }

  async getOrgMemories(
    organizationId: string,
    limit = MAX_ORG_MEMORIES,
  ): Promise<AgentOrgMemory[]> {
    const memories = await this.orgMemoryModel.findAll({
      where: { organizationId },
      order: [['relevanceScore', 'DESC']],
      limit: limit * 2,
    });

    const ranked = this.rankByRelevance(memories);
    const top = ranked.slice(0, limit);

    const ids = top.map((m) => m.id);
    if (ids.length > 0) {
      await this.orgMemoryModel.update(
        { lastAccessedAt: new Date() },
        { where: { id: ids } },
      );
    }

    return top;
  }

  private rankByRelevance<T extends { relevanceScore: number; lastAccessedAt?: Date }>(
    memories: T[],
  ): T[] {
    const now = Date.now();
    return memories
      .map((m) => {
        const daysSinceAccess = m.lastAccessedAt
          ? (now - new Date(m.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
          : 0;
        const decay = 1 / (1 + daysSinceAccess * RECENCY_DECAY_FACTOR);
        const effectiveScore = m.relevanceScore * decay;
        return { memory: m, effectiveScore };
      })
      .sort((a, b) => b.effectiveScore - a.effectiveScore)
      .map((item) => item.memory);
  }

  async extractMemories(
    messages: ConversationMessage[],
    userId: string,
    organizationId: string,
    conversationId: string,
  ): Promise<void> {
    try {
      const existingUser = await this.userMemoryModel.findAll({
        where: { userId },
        order: [['relevanceScore', 'DESC']],
        limit: 50,
      });

      const existingOrg = await this.orgMemoryModel.findAll({
        where: { organizationId },
        order: [['relevanceScore', 'DESC']],
        limit: 30,
      });

      const conversationText = messages
        .filter((m) => m.role !== 'tool_results')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const existingUserText = existingUser
        .map((m) => `[${m.category}] ${m.content}`)
        .join('\n');

      const existingOrgText = existingOrg
        .map((m) => `[${m.category}] ${m.content}`)
        .join('\n');

      const prompt = buildMemoryExtractionPrompt({
        conversationHistory: conversationText,
        existingUserMemories: existingUserText,
        existingOrgMemories: existingOrgText,
      });

      const result = await this.aiService.chatJson<{
        userMemories?: Array<{
          category: string;
          content: string;
          importance: string;
        }>;
        orgMemories?: Array<{
          category: string;
          content: string;
          importance: string;
        }>;
      }>(
        {
          systemPrompt: prompt,
          messages: [
            {
              role: 'user',
              content: 'Extract memories from the conversation above.',
            },
          ],
        },
        organizationId,
      );

      if (result.userMemories?.length) {
        const toCreate = result.userMemories
          .slice(0, MAX_EXTRACT_USER)
          .filter((m) => this.isValidUserCategory(m.category))
          .map((m) => ({
            userId,
            organizationId,
            category: m.category as UserMemoryCategory,
            content: m.content,
            sourceConversationId: conversationId,
            relevanceScore: this.importanceToScore(m.importance),
          }));

        if (toCreate.length > 0) {
          await this.userMemoryModel.bulkCreate(toCreate as any);
          this.logger.log(
            `Extracted ${toCreate.length} user memories from conversation ${conversationId}`,
          );
        }
      }

      if (result.orgMemories?.length) {
        const toCreate = result.orgMemories
          .slice(0, MAX_EXTRACT_ORG)
          .filter((m) => this.isValidOrgCategory(m.category))
          .map((m) => ({
            organizationId,
            category: m.category as OrgMemoryCategory,
            content: m.content,
            relevanceScore: this.importanceToScore(m.importance),
          }));

        if (toCreate.length > 0) {
          await this.orgMemoryModel.bulkCreate(toCreate as any);
          this.logger.log(
            `Extracted ${toCreate.length} org memories from conversation ${conversationId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Memory extraction failed: ${(error as Error).message}`,
      );
    }
  }

  async boostMemory(memoryId: string, isOrg = false): Promise<void> {
    const model = isOrg ? this.orgMemoryModel : this.userMemoryModel;
    const memory = await (model as any).findByPk(memoryId);
    if (memory) {
      memory.relevanceScore = Math.min(memory.relevanceScore + 0.2, 5.0);
      memory.lastAccessedAt = new Date();
      await memory.save();
    }
  }

  async archiveStaleMemories(): Promise<void> {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - STALE_DAYS);

    const [userCount] = await this.userMemoryModel.update(
      { deletedAt: new Date() } as any,
      {
        where: {
          lastAccessedAt: { [Op.lt]: staleDate },
          deletedAt: null,
        },
      },
    );

    const [orgCount] = await this.orgMemoryModel.update(
      { deletedAt: new Date() } as any,
      {
        where: {
          lastAccessedAt: { [Op.lt]: staleDate },
          deletedAt: null,
        },
      },
    );

    if (userCount > 0 || orgCount > 0) {
      this.logger.log(
        `Archived stale memories: ${userCount} user, ${orgCount} org`,
      );
    }
  }

  async deleteUserMemory(memoryId: string): Promise<void> {
    await this.userMemoryModel.destroy({ where: { id: memoryId } });
  }

  async listUserMemories(
    userId: string,
    category?: string,
  ): Promise<AgentUserMemory[]> {
    const where: any = { userId };
    if (category) where.category = category;

    return this.userMemoryModel.findAll({
      where,
      order: [['relevanceScore', 'DESC']],
    });
  }

  async listOrgMemories(organizationId: string): Promise<AgentOrgMemory[]> {
    return this.orgMemoryModel.findAll({
      where: { organizationId },
      order: [['relevanceScore', 'DESC']],
    });
  }

  formatForPrompt(
    userName: string,
    userMemories: AgentUserMemory[],
    orgMemories: AgentOrgMemory[],
  ): string {
    const userMems: MemoryForPrompt[] = userMemories.map((m) => ({
      category: m.category,
      content: m.content,
    }));

    const orgMems: MemoryForPrompt[] = orgMemories.map((m) => ({
      category: m.category,
      content: m.content,
    }));

    return buildMemoryInjectionSection({
      userName,
      userMemories: userMems,
      orgMemories: orgMems,
    });
  }

  private isValidUserCategory(category: string): boolean {
    return Object.values(UserMemoryCategory).includes(
      category as UserMemoryCategory,
    );
  }

  private isValidOrgCategory(category: string): boolean {
    return Object.values(OrgMemoryCategory).includes(
      category as OrgMemoryCategory,
    );
  }

  private importanceToScore(importance: string): number {
    switch (importance) {
      case 'high':
        return 1.5;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.5;
      default:
        return 1.0;
    }
  }
}
