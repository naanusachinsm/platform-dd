import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { UserContextService } from 'src/common/services/user-context.service';

@Controller()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly userContextService: UserContextService,
  ) {}

  @Get('kpis')
  async getKpiStats(@Query() query: AnalyticsQueryDto) {
    if (!query.platformView) {
      await this.analyticsService.ensureOrganizationId(query);
    }
    return this.analyticsService.getKpiStats(query);
  }

  @Get('users')
  async getUsersWithAnalytics(@Query() query: AnalyticsQueryDto) {
    await this.analyticsService.ensureOrganizationId(query);
    return this.analyticsService.getUsersAnalytics(query);
  }

  @Get('organization-breakdown')
  async getOrganizationBreakdown(@Query() query: AnalyticsQueryDto) {
    const currentUser = this.userContextService.getCurrentUser();
    const isSuperAdmin = currentUser?.type === 'employee' && currentUser?.role === 'SUPERADMIN';

    if (!isSuperAdmin) {
      throw new BadRequestException('Organization breakdown is only available to SUPERADMIN employees');
    }

    return this.analyticsService.getOrganizationBreakdown(query);
  }
}
