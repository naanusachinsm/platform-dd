import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectActivityRepository } from '../project-activity.repository';
import {
  ProjectActivity,
  ProjectActivityAction,
  ProjectEntityType,
} from '../entities/project-activity.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ProjectActivityService {
  private readonly logger = new Logger(ProjectActivityService.name);

  constructor(
    private readonly activityRepository: ProjectActivityRepository,
    @InjectModel(ProjectActivity)
    private readonly activityModel: typeof ProjectActivity,
    private readonly userContextService: UserContextService,
  ) {}

  async log(
    projectId: string,
    action: ProjectActivityAction,
    entityType: ProjectEntityType,
    description: string,
    entityId?: string,
    details?: any,
  ) {
    try {
      const user = this.userContextService.getCurrentUser();
      await this.activityRepository.create(
        {
          organizationId: user?.organizationId,
          projectId,
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
      this.logger.warn('Failed to log project activity', e);
    }
  }

  async findAll(projectId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.activityModel.findAndCountAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'performedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      raw: false,
      nest: true,
    });

    const data = rows.map((row: any) => row.get({ plain: true }));

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }
}
