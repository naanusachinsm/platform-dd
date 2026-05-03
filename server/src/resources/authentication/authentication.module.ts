import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { OAuthStateService } from './services/oauth-state.service';
import { RiscService } from './services/risc.service';
import { GmailTokenService } from './services/gmail-token.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../users/entities/user.entity';
import { GmailOAuthToken } from '../users/entities/gmail-oauth-token.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleGmailStrategy } from './strategies/google-gmail.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleGmailAuthGuard } from './guards/google-gmail-auth.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EmployeesModule } from '../employees/employees.module';
import { UsersModule } from '../users/users.module';
import { EmployeeAuthenticationService } from './services/employee-authentication.service';
import { BullModule } from 'src/configuration/bull/bull.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, GmailOAuthToken, Organization, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    SubscriptionsModule,
    EmployeesModule,
    UsersModule,
    BullModule,
    AuditLogsModule,
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    GmailTokenService,
    EmployeeAuthenticationService,
    PasswordResetService,
    PasswordResetTokenRepository,
    OAuthStateService,
    RiscService,
    GoogleAuthGuard,
    GoogleGmailAuthGuard,
    {
      provide: GoogleStrategy,
      useFactory: (
        configService: ConfigService,
        authService: AuthenticationService,
        stateService: OAuthStateService,
      ) => {
        return new GoogleStrategy(configService, authService, stateService);
      },
      inject: [ConfigService, AuthenticationService, OAuthStateService],
    },
    {
      provide: GoogleGmailStrategy,
      useFactory: (
        configService: ConfigService,
        authService: AuthenticationService,
        stateService: OAuthStateService,
      ) => {
        return new GoogleGmailStrategy(configService, authService, stateService);
      },
      inject: [ConfigService, AuthenticationService, OAuthStateService],
    },
  ],
  exports: [AuthenticationService, GmailTokenService, EmployeeAuthenticationService, PasswordResetService],
})
export class AuthenticationModule {}
