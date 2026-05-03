// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { Role } from 'src/resources/rbac/entities/role.entity';
import { Resource } from 'src/resources/rbac/entities/resource.entity';
import { Action } from 'src/resources/rbac/entities/action.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { GmailOAuthToken } from 'src/resources/users/entities/gmail-oauth-token.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { AuditLog } from 'src/resources/audit-logs/entities/audit-log.entity';
import { Employee } from 'src/resources/employees/entities/employee.entity';
import { Notification } from 'src/resources/notifications/entities/notification.entity';
import { PushSubscription } from 'src/resources/notifications/entities/push-subscription.entity';
import { Asset } from 'src/resources/assets/entities/asset.entity';
import { Project } from 'src/resources/projects/entities/project.entity';
import { ProjectMember } from 'src/resources/projects/entities/project-member.entity';
import { BoardColumn } from 'src/resources/projects/entities/board-column.entity';
import { Sprint } from 'src/resources/projects/entities/sprint.entity';
import { Ticket } from 'src/resources/projects/entities/ticket.entity';
import { Board } from 'src/resources/projects/entities/board.entity';
import { ProjectActivity } from 'src/resources/projects/entities/project-activity.entity';
import { TicketComment } from 'src/resources/projects/entities/ticket-comment.entity';
import { ProjectAsset } from 'src/resources/projects/entities/project-asset.entity';
import { ChatRoom } from 'src/resources/chats/entities/chat-room.entity';
import { ChatRoomMember } from 'src/resources/chats/entities/chat-room-member.entity';
import { ChatMessage } from 'src/resources/chats/entities/chat-message.entity';
import { CrmCompany } from 'src/resources/crm/entities/crm-company.entity';
import { CrmContact } from 'src/resources/crm/entities/crm-contact.entity';
import { CrmDeal } from 'src/resources/crm/entities/crm-deal.entity';
import { CrmActivity } from 'src/resources/crm/entities/crm-activity.entity';
import { CrmAuditActivity } from 'src/resources/crm/entities/crm-audit-activity.entity';
import { FinTaxRate } from 'src/resources/finance/entities/fin-tax-rate.entity';
import { FinProduct } from 'src/resources/finance/entities/fin-product.entity';
import { FinVendor } from 'src/resources/finance/entities/fin-vendor.entity';
import { FinInvoice } from 'src/resources/finance/entities/fin-invoice.entity';
import { FinInvoiceItem } from 'src/resources/finance/entities/fin-invoice-item.entity';
import { FinInvoicePayment } from 'src/resources/finance/entities/fin-invoice-payment.entity';
import { FinEstimate } from 'src/resources/finance/entities/fin-estimate.entity';
import { FinEstimateItem } from 'src/resources/finance/entities/fin-estimate-item.entity';
import { FinEstimateVersion } from 'src/resources/finance/entities/fin-estimate-version.entity';
import { FinActivity } from 'src/resources/finance/entities/fin-activity.entity';
import { FinRecurringInvoice } from 'src/resources/finance/entities/fin-recurring-invoice.entity';
import { FinExpenseCategory } from 'src/resources/finance/entities/fin-expense-category.entity';
import { FinExpense } from 'src/resources/finance/entities/fin-expense.entity';
import { HrDepartment } from 'src/resources/hr/departments/entities/hr-department.entity';
import { HrDesignation } from 'src/resources/hr/designations/entities/hr-designation.entity';
import { HrLeaveType } from 'src/resources/hr/leave/entities/hr-leave-type.entity';
import { HrLeaveRequest } from 'src/resources/hr/leave/entities/hr-leave-request.entity';
import { HrLeaveBalance } from 'src/resources/hr/leave/entities/hr-leave-balance.entity';
import { HrAttendance } from 'src/resources/hr/attendance/entities/hr-attendance.entity';
import { HrPayroll } from 'src/resources/hr/payroll/entities/hr-payroll.entity';
import { HrAnnouncement } from 'src/resources/hr/announcements/entities/hr-announcement.entity';
import { HrDocument } from 'src/resources/hr/documents/entities/hr-document.entity';
import { AgentUserMemory } from 'src/common/agent/entities/agent-user-memory.entity';
import { AgentOrgMemory } from 'src/common/agent/entities/agent-org-memory.entity';

@Global()
@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is imported
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [
          User,
          GmailOAuthToken,
          Role,
          Resource,
          Action,
          Organization,
          AuditLog,
          Employee,
          Notification,
          PushSubscription,
          Asset,
          Project,
          ProjectMember,
          BoardColumn,
          Sprint,
          Ticket,
          Board,
          ProjectActivity,
          TicketComment,
          ProjectAsset,
          ChatRoom,
          ChatRoomMember,
          ChatMessage,
          CrmCompany,
          CrmContact,
          CrmDeal,
          CrmActivity,
          CrmAuditActivity,
          FinTaxRate,
          FinProduct,
          FinVendor,
          FinInvoice,
          FinInvoiceItem,
          FinInvoicePayment,
          FinEstimate,
          FinEstimateItem,
          FinEstimateVersion,
          FinActivity,
          FinRecurringInvoice,
          FinExpenseCategory,
          FinExpense,
          HrDepartment,
          HrDesignation,
          HrLeaveType,
          HrLeaveRequest,
          HrLeaveBalance,
          HrAttendance,
          HrPayroll,
          HrAnnouncement,
          HrDocument,
          AgentUserMemory,
          AgentOrgMemory,
        ], // Include all models here
        autoLoadModels: true, // Enable automatic model loading
        // Default off: use `npm run db:migrate` to apply schema. Set DB_SYNCHRONIZE=true in .env for local auto-sync only.
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        sync: { force: false }, // Don't force sync (which would drop tables)
        pool: {
          max: 10, // Maximum number of connection in pool
          min: 0, // Minimum number of connection in pool
          acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
          idle: 10000, // Maximum time, in milliseconds, that a connection can be idle before being released
        },
        logging: false, // Disable Sequelize query logging
      }),
    }),
    SequelizeModule.forFeature([
      User,
      Role,
      Resource,
      Action,
      Organization,
      AuditLog,
      GmailOAuthToken,
      Employee,
      Notification,
      PushSubscription,
      Asset,
      Project,
      ProjectMember,
      BoardColumn,
      Sprint,
      Ticket,
      Board,
      ProjectActivity,
      TicketComment,
      ProjectAsset,
      ChatRoom,
      ChatRoomMember,
      ChatMessage,
      CrmCompany,
      CrmContact,
      CrmDeal,
      CrmActivity,
      CrmAuditActivity,
      FinTaxRate,
      FinProduct,
      FinVendor,
      FinInvoice,
      FinInvoiceItem,
      FinInvoicePayment,
      FinEstimate,
      FinEstimateItem,
      FinEstimateVersion,
      FinActivity,
      FinRecurringInvoice,
      FinExpenseCategory,
      FinExpense,
      HrDepartment,
      HrDesignation,
      HrLeaveType,
      HrLeaveRequest,
      HrLeaveBalance,
      HrAttendance,
      HrPayroll,
      HrAnnouncement,
      HrDocument,
      AgentUserMemory,
      AgentOrgMemory,
    ]), // Register all models here
  ],
  providers: [DatabaseService],
  exports: [SequelizeModule, DatabaseService], // Export SequelizeModule to make it available globally
})
export class DatabaseModule {}
