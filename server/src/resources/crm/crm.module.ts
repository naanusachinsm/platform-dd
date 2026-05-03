import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CrmCompany } from './entities/crm-company.entity';
import { CrmContact } from './entities/crm-contact.entity';
import { CrmDeal } from './entities/crm-deal.entity';
import { CrmActivity } from './entities/crm-activity.entity';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmCompanyRepository } from './crm-company.repository';
import { CrmContactRepository } from './crm-contact.repository';
import { CrmDealRepository } from './crm-deal.repository';
import { CrmActivityRepository } from './crm-activity.repository';
import { CrmAuditActivity } from './entities/crm-audit-activity.entity';
import { CrmAuditActivityRepository } from './crm-audit-activity.repository';
import { CrmActivityTrackerService } from './services/crm-activity-tracker.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CrmCompany, CrmContact, CrmDeal, CrmActivity, CrmAuditActivity]),
    CommonModule,
  ],
  controllers: [CrmController],
  providers: [
    CrmService,
    CrmCompanyRepository,
    CrmContactRepository,
    CrmDealRepository,
    CrmActivityRepository,
    CrmAuditActivityRepository,
    CrmActivityTrackerService,
  ],
  exports: [CrmService, CrmActivityTrackerService],
})
export class CrmModule {}
