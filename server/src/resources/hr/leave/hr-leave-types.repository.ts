import { Injectable } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrLeaveType } from './entities/hr-leave-type.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrLeaveTypesRepository extends BaseRepository<HrLeaveType> {
  constructor(
    @InjectModel(HrLeaveType) model: typeof HrLeaveType,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }

  /**
   * Global defaults (organizationId IS NULL) are visible to all orgs.
   * Org-specific leave types are visible only to that org.
   */
  protected applyTenantFilter(
    whereConditions: WhereOptions<HrLeaveType> = {},
    bypassTenantFilter: boolean = false,
    organizationId?: string,
  ): WhereOptions<HrLeaveType> {
    if (bypassTenantFilter && this.isSuperAdmin()) {
      return whereConditions;
    }

    if (this.isEmployee()) {
      if (organizationId) {
        return {
          ...whereConditions,
          [Op.or]: [{ organizationId: null }, { organizationId }],
        } as WhereOptions<HrLeaveType>;
      }
      return whereConditions;
    }

    const userOrgId = this.getCurrentUserOrganizationId();
    if (!userOrgId) {
      return { ...whereConditions, organizationId: null } as WhereOptions<HrLeaveType>;
    }

    return {
      ...whereConditions,
      [Op.or]: [{ organizationId: null }, { organizationId: userOrgId }],
    } as WhereOptions<HrLeaveType>;
  }
}
