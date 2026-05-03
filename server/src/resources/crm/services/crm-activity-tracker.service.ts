import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CrmAuditActivityRepository } from '../crm-audit-activity.repository';
import { CrmAuditActivity, CrmAuditAction, CrmAuditEntityType } from '../entities/crm-audit-activity.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { User } from 'src/resources/users/entities/user.entity';

@Injectable()
export class CrmActivityTrackerService {
  private readonly logger = new Logger(CrmActivityTrackerService.name);

  constructor(
    private readonly activityRepository: CrmAuditActivityRepository,
    @InjectModel(CrmAuditActivity)
    private readonly activityModel: typeof CrmAuditActivity,
    private readonly userContextService: UserContextService,
  ) {}

  async log(
    action: CrmAuditAction,
    entityType: CrmAuditEntityType,
    entityId: string,
    description: string,
    details?: any,
  ) {
    try {
      const user = this.userContextService.getCurrentUser();
      await this.activityRepository.create(
        {
          organizationId: user?.organizationId,
          action,
          entityType,
          entityId,
          description,
          performedByUserId: user?.sub,
          details,
        } as any,
        undefined,
      );
    } catch (e) {
      this.logger.warn('Failed to log CRM activity', e);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    entityType?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (query.entityType) where.entityType = query.entityType;

    const user = this.userContextService.getCurrentUser();
    if (user?.organizationId) where.organizationId = user.organizationId;

    const { rows, count } = await this.activityModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'performedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const data = rows.map((r) => r.toJSON());

    return {
      data,
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      limit,
    };
  }
}
