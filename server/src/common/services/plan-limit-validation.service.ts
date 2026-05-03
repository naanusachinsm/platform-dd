import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SubscriptionsService } from 'src/resources/subscriptions/subscriptions.service';
import { User } from 'src/resources/users/entities/user.entity';
import { UserStatus } from 'src/resources/users/entities/user.entity';
import { SubscriptionStatus } from 'src/resources/subscriptions/entities/subscription.entity';
import { Op } from 'sequelize';

export interface PlanLimitCheckResult {
  currentCount: number;
  maxLimit: number | null;
  wouldExceed: boolean;
  planName: string;
  limitType: 'users';
  subscriptionId?: string;
  isTrial?: boolean;
}

@Injectable()
export class PlanLimitValidationService {
  private readonly logger = new Logger(PlanLimitValidationService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /**
   * Check if adding users would exceed the plan limit
   * Checks against subscription.userCount first, then falls back to plan.maxUsers
   * 
   * IMPORTANT: This method only READS subscription.userCount for validation.
   * It does NOT modify or update subscription.userCount.
   * userCount should ONLY be updated during upgrade/payment flow.
   */
  async checkUserLimit(
    organizationId: string,
    additionalUsers: number = 1,
  ): Promise<PlanLimitCheckResult> {
    const subscription = await this.subscriptionsService.findActiveSubscriptionByOrganizationId(
      organizationId,
    );

    if (!subscription || !subscription.plan) {
      return {
        currentCount: 0,
        maxLimit: null,
        wouldExceed: false,
        planName: 'No Plan',
        limitType: 'users',
      };
    }

    const plan = subscription.plan;
    
    const currentUserCount = await this.userModel.count({
      where: {
        organizationId,
        status: {
          [Op.in]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
        },
      },
    });

    if (subscription.status === SubscriptionStatus.TRIAL) {
      return {
        currentCount: currentUserCount,
        maxLimit: null,
        wouldExceed: false,
        planName: plan.name,
        limitType: 'users',
        subscriptionId: subscription.id,
        isTrial: true,
      };
    }

    let maxUsers: number | null = null;
    if (subscription.userCount !== null && subscription.userCount !== undefined) {
      maxUsers = subscription.userCount;
    } else {
      maxUsers = plan.maxUsers;
    }

    if (maxUsers === null) {
      return {
        currentCount: currentUserCount,
        maxLimit: null,
        wouldExceed: false,
        planName: plan.name,
        limitType: 'users',
        subscriptionId: subscription.id,
        isTrial: false,
      };
    }

    const wouldExceed = currentUserCount + additionalUsers > maxUsers;

    return {
      currentCount: currentUserCount,
      maxLimit: maxUsers,
      wouldExceed,
      planName: plan.name,
      limitType: 'users',
      subscriptionId: subscription.id,
      isTrial: false,
    };
  }

  /**
   * Validate user limit and throw exception if exceeded
   */
  async validateUserLimit(
    organizationId: string,
    additionalUsers: number = 1,
  ): Promise<void> {
    const checkResult = await this.checkUserLimit(organizationId, additionalUsers);

    if (checkResult.wouldExceed) {
      const isTrial = checkResult.isTrial === true;

      const message = isTrial
        ? `Cannot add ${additionalUsers} user(s). Your trial subscription allows up to ${checkResult.maxLimit} users. You currently have ${checkResult.currentCount} users. Please upgrade your subscription to add more users.`
        : `Cannot add ${additionalUsers} user(s). Your ${checkResult.planName} subscription allows a maximum of ${checkResult.maxLimit} users. You currently have ${checkResult.currentCount} users.`;

      throw new BadRequestException({
        message,
        limitExceeded: true,
        currentCount: checkResult.currentCount,
        maxLimit: checkResult.maxLimit,
        planName: checkResult.planName,
        limitType: checkResult.limitType,
        subscriptionId: checkResult.subscriptionId,
      });
    }
  }
}
