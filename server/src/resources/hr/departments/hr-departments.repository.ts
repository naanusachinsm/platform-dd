import { Injectable } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrDepartment } from './entities/hr-department.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrDepartmentsRepository extends BaseRepository<HrDepartment> {
  constructor(
    @InjectModel(HrDepartment) model: typeof HrDepartment,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }

  /**
   * Global defaults (organizationId IS NULL) are visible to all orgs.
   * Org-specific departments are visible only to that org.
   */
  protected applyTenantFilter(
    whereConditions: WhereOptions<HrDepartment> = {},
    bypassTenantFilter: boolean = false,
    organizationId?: string,
  ): WhereOptions<HrDepartment> {
    if (bypassTenantFilter && this.isSuperAdmin()) {
      return whereConditions;
    }

    if (this.isEmployee()) {
      if (organizationId) {
        return {
          ...whereConditions,
          [Op.or]: [{ organizationId: null }, { organizationId }],
        } as WhereOptions<HrDepartment>;
      }
      return whereConditions;
    }

    const userOrgId = this.getCurrentUserOrganizationId();
    if (!userOrgId) {
      return { ...whereConditions, organizationId: null } as WhereOptions<HrDepartment>;
    }

    return {
      ...whereConditions,
      [Op.or]: [{ organizationId: null }, { organizationId: userOrgId }],
    } as WhereOptions<HrDepartment>;
  }
}
