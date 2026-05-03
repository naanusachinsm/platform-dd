import { Injectable, Logger } from '@nestjs/common';
import { ProjectMemberRepository } from '../project-member.repository';
import { UserContextService } from 'src/common/services/user-context.service';
import { EmailQueue } from 'src/configuration/bull/queues/email.queue';
import { User } from 'src/resources/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TicketNotificationService {
  private readonly logger = new Logger(TicketNotificationService.name);

  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly userContextService: UserContextService,
    private readonly emailQueue: EmailQueue,
    private readonly configService: ConfigService,
  ) {}

  private getActorName(): string {
    const user = this.userContextService.getCurrentUser();
    return user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'Someone';
  }

  private getFrontendUrl(): string {
    return this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
  }

  private async getRecipientEmails(projectId: string): Promise<string[]> {
    const currentUserId = this.userContextService.getCurrentUser()?.sub;

    const members = await this.projectMemberRepository.findAll({
      where: { projectId } as any,
      pagination: { page: 1, limit: 500 },
      bypassTenantFilter: true,
      include: [
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
      ],
    });

    return (members.data as any[])
      .filter((m) => m.userId !== currentUserId && m.user?.email)
      .map((m) => m.user.email);
  }

  private async sendToMembers(projectId: string, subject: string, html: string): Promise<void> {
    try {
      const emails = await this.getRecipientEmails(projectId);
      if (emails.length === 0) return;

      await Promise.all(
        emails.map((email) =>
          this.emailQueue.sendNotificationEmail(email, subject, html).catch((err) => {
            this.logger.warn(`Failed to queue email to ${email}: ${err.message}`);
          }),
        ),
      );

      this.logger.log(`Queued ticket notification to ${emails.length} recipients: "${subject}"`);
    } catch (error: any) {
      this.logger.error(`Failed to send ticket notifications: ${error?.message}`);
    }
  }

  private wrapHtml(heading: string, bodyContent: string, ticketUrl?: string): string {
    const ctaButton = ticketUrl
      ? `<tr>
           <td align="center" style="padding: 0 40px 40px 40px;">
             <a href="${ticketUrl}" style="display: inline-block; background-color: #2a2a2a; color: #fafafa; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; font-family: 'Inter', sans-serif;">View Ticket</a>
           </td>
         </tr>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #2a2a2a; height: 4px; border-radius: 8px 8px 0 0;"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.2; font-family: 'Inter', sans-serif;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              ${bodyContent}
            </td>
          </tr>
          ${ctaButton}
          <tr>
            <td style="padding: 0 40px 40px 40px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 30px 0 10px 0; color: #8a8a8a; font-size: 14px; line-height: 1.6; font-family: 'Inter', sans-serif;">Best regards,</p>
              <p style="margin: 0; color: #1a1a1a; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;">The Byteful Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private detailBox(rows: string): string {
    return `<div style="background-color: #f8f9fa; padding: 16px 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2a2a2a;">
      ${rows}
    </div>`;
  }

  private detailRow(label: string, value: string): string {
    return `<p style="margin: 6px 0; color: #1a1a1a; font-size: 14px; font-family: 'Inter', sans-serif;"><strong>${label}:</strong> ${value}</p>`;
  }

  async notifyTicketCreated(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    type: string,
    priority: string,
  ): Promise<void> {
    const actor = this.getActorName();
    const subject = `[${ticketKey}] New ticket: ${title}`;
    const url = `${this.getFrontendUrl()}/dashboard/projects/${projectKey}`;

    const body = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> created a new ticket in project <strong>${projectKey}</strong>.
      </p>
      ${this.detailBox(
        this.detailRow('Ticket', ticketKey) +
        this.detailRow('Title', title) +
        this.detailRow('Type', type || 'TASK') +
        this.detailRow('Priority', priority || 'MEDIUM')
      )}`;

    this.sendToMembers(projectId, subject, this.wrapHtml('Ticket Created', body, url));
  }

  async notifyTicketUpdated(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    changes: string[],
  ): Promise<void> {
    if (changes.length === 0) return;

    const actor = this.getActorName();
    const subject = `[${ticketKey}] Updated: ${title}`;
    const url = `${this.getFrontendUrl()}/dashboard/projects/${projectKey}`;

    const changeList = changes.map((c) => `<li style="margin: 4px 0; color: #1a1a1a; font-size: 14px;">${c}</li>`).join('');

    const body = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> updated ticket <strong>${ticketKey}</strong> in project <strong>${projectKey}</strong>.
      </p>
      ${this.detailBox(`
        <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Changes:</p>
        <ul style="margin: 0; padding-left: 20px;">${changeList}</ul>
      `)}`;

    this.sendToMembers(projectId, subject, this.wrapHtml('Ticket Updated', body, url));
  }

  async notifyTicketMoved(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    fromColumn: string,
    toColumn: string,
  ): Promise<void> {
    const actor = this.getActorName();
    const subject = `[${ticketKey}] Moved: ${fromColumn} → ${toColumn}`;
    const url = `${this.getFrontendUrl()}/dashboard/projects/${projectKey}`;

    const body = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> moved ticket <strong>${ticketKey}</strong> on the board.
      </p>
      ${this.detailBox(
        this.detailRow('Ticket', `${ticketKey} – ${title}`) +
        this.detailRow('From', fromColumn) +
        this.detailRow('To', toColumn)
      )}`;

    this.sendToMembers(projectId, subject, this.wrapHtml('Ticket Moved', body, url));
  }

  async notifyTicketAssigned(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    assigneeName: string | null,
  ): Promise<void> {
    const actor = this.getActorName();
    const subject = assigneeName
      ? `[${ticketKey}] Assigned to ${assigneeName}`
      : `[${ticketKey}] Unassigned`;
    const url = `${this.getFrontendUrl()}/dashboard/projects/${projectKey}`;

    const actionText = assigneeName
      ? `assigned ticket <strong>${ticketKey}</strong> to <strong>${assigneeName}</strong>`
      : `unassigned ticket <strong>${ticketKey}</strong>`;

    const body = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> ${actionText} in project <strong>${projectKey}</strong>.
      </p>
      ${this.detailBox(
        this.detailRow('Ticket', `${ticketKey} – ${title}`)
      )}`;

    this.sendToMembers(projectId, subject, this.wrapHtml('Ticket Assignment', body, url));
  }

  async notifyTicketDeleted(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
  ): Promise<void> {
    const actor = this.getActorName();
    const subject = `[${ticketKey}] Deleted: ${title}`;

    const body = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> deleted ticket <strong>${ticketKey}</strong> from project <strong>${projectKey}</strong>.
      </p>
      ${this.detailBox(
        this.detailRow('Ticket', ticketKey) +
        this.detailRow('Title', title)
      )}`;

    this.sendToMembers(projectId, subject, this.wrapHtml('Ticket Deleted', body));
  }

  async notifyCommentAdded(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    commentContent: string,
    mentionedUserIds: string[] = [],
  ): Promise<void> {
    const actor = this.getActorName();
    const url = `${this.getFrontendUrl()}/dashboard/projects/${projectKey}`;

    const displayContent = this.stripMentionTokens(commentContent);
    const preview = displayContent.length > 300
      ? displayContent.substring(0, 300) + '...'
      : displayContent;

    const commentBody = `
      <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        <strong>${actor}</strong> commented on ticket <strong>${ticketKey}</strong> in project <strong>${projectKey}</strong>.
      </p>
      ${this.detailBox(`
        <p style="margin: 0; color: #555; font-size: 14px; font-style: italic; line-height: 1.6;">"${preview}"</p>
      `)}`;

    const subject = `[${ticketKey}] New comment on: ${title}`;
    this.sendToMembers(projectId, subject, this.wrapHtml('New Comment', commentBody, url));

    if (mentionedUserIds.length > 0) {
      await this.sendMentionNotifications(
        projectId, projectKey, ticketKey, title, preview, mentionedUserIds, url,
      );
    }
  }

  private async sendMentionNotifications(
    projectId: string,
    projectKey: string,
    ticketKey: string,
    title: string,
    preview: string,
    mentionedUserIds: string[],
    ticketUrl: string,
  ): Promise<void> {
    try {
      const actor = this.getActorName();
      const currentUserId = this.userContextService.getCurrentUser()?.sub;

      const members = await this.projectMemberRepository.findAll({
        where: { projectId } as any,
        pagination: { page: 1, limit: 500 },
        bypassTenantFilter: true,
        include: [
          { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        ],
      });

      const mentionedSet = new Set(mentionedUserIds);
      const mentionedEmails = (members.data as any[])
        .filter((m) => mentionedSet.has(m.userId) && m.userId !== currentUserId && m.user?.email)
        .map((m) => m.user.email);

      if (mentionedEmails.length === 0) return;

      const subject = `[${ticketKey}] You were mentioned in: ${title}`;
      const body = `
        <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; font-family: 'Inter', sans-serif;">
          <strong>${actor}</strong> mentioned you in a comment on ticket <strong>${ticketKey}</strong> in project <strong>${projectKey}</strong>.
        </p>
        ${this.detailBox(`
          <p style="margin: 0; color: #555; font-size: 14px; font-style: italic; line-height: 1.6;">"${preview}"</p>
        `)}`;

      const html = this.wrapHtml('You Were Mentioned', body, ticketUrl);

      await Promise.all(
        mentionedEmails.map((email) =>
          this.emailQueue.sendNotificationEmail(email, subject, html).catch((err) => {
            this.logger.warn(`Failed to queue mention email to ${email}: ${err.message}`);
          }),
        ),
      );

      this.logger.log(`Queued mention notification to ${mentionedEmails.length} users for ${ticketKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send mention notifications: ${error?.message}`);
    }
  }

  private stripMentionTokens(content: string): string {
    return content
      .replace(/@\[([^\]]+)\]\([a-f0-9-]+\)/g, '@$1')
      .replace(/#\[([^\]]+)\]\([a-f0-9-]+\)/g, '$1');
  }
}
