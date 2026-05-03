import { Routes } from '@nestjs/core';
import { AuthenticationModule } from '../resources/authentication/authentication.module';
import { RbacModule } from '../resources/rbac/rbac.module';
import { UsersModule } from 'src/resources/users/users.module';
import { OrganizationsModule } from 'src/resources/organizations/organizations.module';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { BullModule } from 'src/configuration/bull/bull.module';
import { SubscriptionsModule } from 'src/resources/subscriptions/subscriptions.module';
import { PaymentsModule } from 'src/resources/payments/payments.module';
import { AnalyticsModule } from 'src/resources/analytics/analytics.module';
import { EmployeesModule } from 'src/resources/employees/employees.module';
import { NotificationsModule } from 'src/resources/notifications/notifications.module';
import { AssetsModule } from 'src/resources/assets/assets.module';
import { MulterModule } from 'src/configuration/multer/multer.module';
import { ProjectsModule } from 'src/resources/projects/projects.module';
import { CrmModule } from 'src/resources/crm/crm.module';
import { HrModule } from 'src/resources/hr/hr.module';
import { FinanceModule } from 'src/resources/finance/finance.module';
import { ChatsModule } from 'src/resources/chats/chats.module';
import { AiModule } from 'src/common/ai/ai.module';
import { AgentModule } from 'src/common/agent/agent.module';

export const routes: Routes = [
  {
    path: '/api/v1',
    children: [
      {
        path: '/auth',
        module: AuthenticationModule,
      },
      {
        path: '/rbac',
        module: RbacModule,
      },
      {
        path: '/users',
        module: UsersModule,
      },
      {
        path: '/organizations',
        module: OrganizationsModule,
      },
      {
        path: '/audit-logs',
        module: AuditLogsModule,
      },
      {
        path: '/subscriptions',
        module: SubscriptionsModule,
      },
      {
        path: '/payments',
        module: PaymentsModule,
      },
      {
        path: '/analytics',
        module: AnalyticsModule,
      },
      {
        path: '/employees',
        module: EmployeesModule,
      },
      {
        path: '/notifications',
        module: NotificationsModule,
      },
      {
        path: '/assets',
        module: AssetsModule,
      },
      {
        path: '/projects',
        module: ProjectsModule,
      },
      {
        path: '/crm',
        module: CrmModule,
      },
      {
        path: '/hr',
        module: HrModule,
      },
      {
        path: '/finance',
        module: FinanceModule,
      },
      {
        path: '/chats',
        module: ChatsModule,
      },
      {
        path: '/upload',
        module: MulterModule,
      },
      {
        path: '/ai',
        module: AiModule,
      },
      {
        path: '/agent',
        module: AgentModule,
      },
      {
        path: '/',
        module: BullModule,
      },
    ],
  },
];
