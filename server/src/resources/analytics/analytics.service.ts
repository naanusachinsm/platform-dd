import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User, UserStatus } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Organization)
    private readonly organizationModel: typeof Organization,
    @InjectModel(Subscription)
    private readonly subscriptionModel: typeof Subscription,
    @InjectModel(SubscriptionPlan)
    private readonly subscriptionPlanModel: typeof SubscriptionPlan,
    private readonly userContextService: UserContextService,
  ) {}

  async ensureOrganizationId(query: AnalyticsQueryDto): Promise<string> {
    if (query.organizationId) {
      return query.organizationId;
    }

    const currentUser = this.userContextService.getCurrentUser();
    const isEmployee = currentUser?.type === 'employee';

    if (isEmployee) {
      throw new BadRequestException('Organization ID is required. Please select an organization from the organization selector.');
    }

    if (currentUser?.organizationId) {
      query.organizationId = currentUser.organizationId;
      return currentUser.organizationId;
    }

    const userId = currentUser?.sub;
    if (userId) {
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'organizationId'],
      });
      if (user?.organizationId) {
        query.organizationId = user.organizationId;
        return user.organizationId;
      }
    }

    throw new BadRequestException('Organization ID is required.');
  }

  async getKpiStats(query: AnalyticsQueryDto) {
    const { organizationId, platformView } = query;

    if (platformView) {
      return this.getPlatformKpiStats(query);
    }

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.userModel.count({ where: { organizationId } }),
      this.userModel.count({ where: { organizationId, status: UserStatus.ACTIVE } }),
      this.userModel.count({ where: { organizationId, status: { [Op.ne]: UserStatus.ACTIVE } } }),
    ]);

    return {
      totalUsers: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
    };
  }

  private async getPlatformKpiStats(query: AnalyticsQueryDto) {
    const [totalOrganizations, totalUsers, activeUsers] = await Promise.all([
      this.organizationModel.count(),
      this.userModel.count(),
      this.userModel.count({ where: { status: UserStatus.ACTIVE } }),
    ]);

    return {
      totalOrganizations,
      totalUsers: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
    };
  }

  async getUsersAnalytics(query: AnalyticsQueryDto) {
    const { organizationId, page = 1, limit = 10 } = query;

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await this.userModel.findAndCountAll({
      where: { organizationId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getOrganizationBreakdown(query: AnalyticsQueryDto) {
    const organizations = await this.organizationModel.findAll({
      attributes: ['id', 'name', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const breakdown = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await this.userModel.count({
          where: { organizationId: org.id },
        });

        return {
          id: org.id,
          name: org.name,
          createdAt: org.createdAt,
          totalUsers: userCount,
        };
      }),
    );

    return breakdown;
  }
}
