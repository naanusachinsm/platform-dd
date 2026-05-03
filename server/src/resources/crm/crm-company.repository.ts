import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { CrmCompany } from './entities/crm-company.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class CrmCompanyRepository extends BaseRepository<CrmCompany> {
  constructor(
    @InjectModel(CrmCompany)
    companyModel: typeof CrmCompany,
    userContextService: UserContextService,
  ) {
    super(companyModel, undefined, userContextService);
  }
}
