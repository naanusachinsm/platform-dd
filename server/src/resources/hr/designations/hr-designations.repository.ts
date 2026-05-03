import { Injectable } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrDesignation } from './entities/hr-designation.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrDesignationsRepository extends BaseRepository<HrDesignation> {
  constructor(
    @InjectModel(HrDesignation) model: typeof HrDesignation,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }

  /**
   * Global defaults (organizationId IS NULL) are visible to all orgs.
   * Org-specific designations are visible only to that org.
   */
  protected applyTenantFilter(
    whereConditions: WhereOptions<HrDesignation> = {},
    bypassTenantFilter: boolean = false,
    organizationId?: string,
  ): WhereOptions<HrDesignation> {
    if (bypassTenantFilter && this.isSuperAdmin()) {
      return whereConditions;
    }

    if (this.isEmployee()) {
      if (organizationId) {
        return {
          ...whereConditions,
          [Op.or]: [{ organizationId: null }, { organizationId }],
        } as WhereOptions<HrDesignation>;
      }
      return whereConditions;
    }

    const userOrgId = this.getCurrentUserOrganizationId();
    if (!userOrgId) {
      return { ...whereConditions, organizationId: null } as WhereOptions<HrDesignation>;
    }

    return {
      ...whereConditions,
      [Op.or]: [{ organizationId: null }, { organizationId: userOrgId }],
    } as WhereOptions<HrDesignation>;
  }
}
