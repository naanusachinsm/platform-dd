import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HrDepartment } from './departments/entities/hr-department.entity';
import { HrDesignation } from './designations/entities/hr-designation.entity';
import { HrLeaveType } from './leave/entities/hr-leave-type.entity';
import { HrLeaveRequest } from './leave/entities/hr-leave-request.entity';
import { HrLeaveBalance } from './leave/entities/hr-leave-balance.entity';
import { HrAttendance } from './attendance/entities/hr-attendance.entity';
import { HrPayroll } from './payroll/entities/hr-payroll.entity';
import { HrAnnouncement } from './announcements/entities/hr-announcement.entity';
import { HrDocument } from './documents/entities/hr-document.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { HrDepartmentsRepository } from './departments/hr-departments.repository';
import { HrDesignationsRepository } from './designations/hr-designations.repository';
import { HrLeaveTypesRepository } from './leave/hr-leave-types.repository';
import { HrLeaveRequestsRepository } from './leave/hr-leave-requests.repository';
import { HrLeaveBalancesRepository } from './leave/hr-leave-balances.repository';
import { HrAttendanceRepository } from './attendance/hr-attendance.repository';
import { HrPayrollRepository } from './payroll/hr-payroll.repository';
import { HrAnnouncementsRepository } from './announcements/hr-announcements.repository';
import { HrDocumentsRepository } from './documents/hr-documents.repository';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      HrDepartment,
      HrDesignation,
      HrLeaveType,
      HrLeaveRequest,
      HrLeaveBalance,
      HrAttendance,
      HrPayroll,
      HrAnnouncement,
      HrDocument,
      User,
    ]),
    CommonModule,
  ],
  controllers: [HrController],
  providers: [
    HrService,
    HrDepartmentsRepository,
    HrDesignationsRepository,
    HrLeaveTypesRepository,
    HrLeaveRequestsRepository,
    HrLeaveBalancesRepository,
    HrAttendanceRepository,
    HrPayrollRepository,
    HrAnnouncementsRepository,
    HrDocumentsRepository,
  ],
  exports: [HrService],
})
export class HrModule {}
