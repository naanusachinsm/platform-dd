import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './configuration/config/config.module';
import { AxiosModule } from './configuration/axios/axios.module';
import { DatabaseModule } from './configuration/database/database.module';
import { LoggerModule } from './configuration/logger/logger.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditLogMiddleware } from './common/middleware/audit-log.middleware';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';
import { CommonModule } from './common/common.module';
import { JwtModule } from './configuration/jwt/jwt.module';
import { ThrottleModule } from './configuration/throttle/throttle.module';
import { EventsModule } from './configuration/events/events.module';
import { ExcelModule } from './configuration/excel/excel.module';
import { EmailModule } from './configuration/email/email.module';
import { PdfModule } from './configuration/pdf/pdf.module';
import { HttpModule } from './configuration/http/http.module';
import { CacheModule } from './configuration/cache/cache.module';
import { MulterModule } from './configuration/multer/multer.module';
import { BullModule } from './configuration/bull/bull.module';
import { RouterModule } from '@nestjs/core';
import { routes } from './routes/api.routes';
import { AuthenticationModule } from './resources/authentication/authentication.module';
import { WsModule } from './resources/ws/ws.module';
import { RbacModule } from './resources/rbac/rbac.module';
import { UsersModule } from './resources/users/users.module';
import { OrganizationsModule } from './resources/organizations/organizations.module';
import { AuditLogsModule } from './resources/audit-logs/audit-logs.module';
import { SubscriptionsModule } from './resources/subscriptions/subscriptions.module';
import { AnalyticsModule } from './resources/analytics/analytics.module';
import { EmployeesModule } from './resources/employees/employees.module';
import { NotificationsModule } from './resources/notifications/notifications.module';
import { AssetsModule } from './resources/assets/assets.module';
import { ProjectsModule } from './resources/projects/projects.module';
import { CrmModule } from './resources/crm/crm.module';
import { HrModule } from './resources/hr/hr.module';
import { FinanceModule } from './resources/finance/finance.module';
import { ChatsModule } from './resources/chats/chats.module';
import { AgentModule } from './common/agent/agent.module';

@Module({
  imports: [
    ConfigModule,
    AxiosModule,
    DatabaseModule,
    LoggerModule,
    CommonModule,
    JwtModule,
    ThrottleModule,
    EventsModule,
    ExcelModule,
    EmailModule,
    PdfModule,
    HttpModule,
    //CacheModule,
    MulterModule,
    WsModule,
    AuthenticationModule,
    RbacModule,
    UsersModule,
    OrganizationsModule,
    AuditLogsModule,
    SubscriptionsModule,
    AnalyticsModule,
    EmployeesModule,
    NotificationsModule,
    AssetsModule,
    ProjectsModule,
    CrmModule,
    HrModule,
    FinanceModule,
    ChatsModule,
    AgentModule,
    RouterModule.register(routes),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(AuditLogMiddleware)
      .forRoutes({ path: '/api/v1/*', method: RequestMethod.ALL });
  }
}
