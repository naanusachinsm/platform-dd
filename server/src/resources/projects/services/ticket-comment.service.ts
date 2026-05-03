import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TicketCommentRepository } from '../ticket-comment.repository';
import { TicketRepository } from '../ticket.repository';
import { TicketComment } from '../entities/ticket-comment.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { CreateTicketCommentDto, UpdateTicketCommentDto } from '../dto/ticket-comment.dto';
import { TicketNotificationService } from './ticket-notification.service';

@Injectable()
export class TicketCommentService {
  constructor(
    private readonly commentRepository: TicketCommentRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly userContextService: UserContextService,
    private readonly ticketNotificationService: TicketNotificationService,
  ) {}

  private async ensureTicketInProject(ticketId: string, projectId: string) {
    const ticket = await this.ticketRepository.findById(ticketId) as any;
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.projectId !== projectId) throw new NotFoundException('Ticket not found in this project');
    return ticket;
  }

  async findAll(projectId: string, ticketId: string) {
    await this.ensureTicketInProject(ticketId, projectId);
    return this.commentRepository.findAll({
      where: { ticketId } as any,
      pagination: { page: 1, limit: 500, sortBy: 'createdAt', sortOrder: 'DESC' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
      ],
      bypassTenantFilter: true,
    });
  }

  async create(projectId: string, ticketId: string, dto: CreateTicketCommentDto) {
    await this.ensureTicketInProject(ticketId, projectId);
    const user = this.userContextService.getCurrentUser();
    const comment = await this.commentRepository.create({
      ticketId,
      authorId: user?.sub,
      organizationId: user?.organizationId,
      content: dto.content,
    } as any);

    const ticket = await this.ticketRepository.findById(ticketId) as any;
    if (ticket) {
      const projectKey = ticket.ticketKey?.split('-')[0] || '';
      const mentionedUserIds = this.extractMentionedUserIds(dto.content);
      this.ticketNotificationService.notifyCommentAdded(
        ticket.projectId, projectKey, ticket.ticketKey, ticket.title, dto.content, mentionedUserIds,
      ).catch(() => {});
    }

    return this.findOne((comment as any).id);
  }

  async findOne(id: string) {
    const comment = await this.commentRepository.findOne({
      where: { id } as any,
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
      ],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(projectId: string, id: string, dto: UpdateTicketCommentDto) {
    const comment = await this.commentRepository.findById(id) as any;
    if (!comment) throw new NotFoundException('Comment not found');
    await this.ensureTicketInProject(comment.ticketId, projectId);

    const user = this.userContextService.getCurrentUser();
    if (comment.authorId !== user?.sub) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    await this.commentRepository.update({ id } as any, { content: dto.content } as any);
    return this.findOne(id);
  }

  async remove(projectId: string, id: string) {
    const comment = await this.commentRepository.findById(id) as any;
    if (!comment) throw new NotFoundException('Comment not found');
    await this.ensureTicketInProject(comment.ticketId, projectId);

    const user = this.userContextService.getCurrentUser();
    if (comment.authorId !== user?.sub) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.commentRepository.delete({ id } as any);
  }

  private extractMentionedUserIds(content: string): string[] {
    const regex = /@\[[^\]]+\]\(([a-f0-9-]+)\)/g;
    const ids = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      ids.add(match[1]);
    }
    return Array.from(ids);
  }
}
