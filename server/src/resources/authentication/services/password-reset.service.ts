import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PasswordResetTokenRepository } from '../password-reset-token.repository';
import { PasswordResetToken, UserType } from '../entities/password-reset-token.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetOtpDto } from '../dto/verify-reset-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EmployeesService } from 'src/resources/employees/employees.service';
import { UsersService } from 'src/resources/users/users.service';
import { EmailQueue } from 'src/configuration/bull/queues/email.queue';
import { CryptoUtilityService } from 'src/common/services/crypto-utility.service';
import { TransactionManager } from 'src/common/services/transaction-manager.service';
import { EmployeeStatus } from 'src/resources/employees/entities/employee.entity';
import { UserStatus } from 'src/resources/users/entities/user.entity';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly OTP_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly employeesService: EmployeesService,
    private readonly usersService: UsersService,
    private readonly emailQueue: EmailQueue,
    private readonly cryptoUtilityService: CryptoUtilityService,
    private readonly transactionManager: TransactionManager,
  ) {}

  private async findValidTokenForOtp(
    email: string,
    otp: string,
    transaction?: any,
  ): Promise<PasswordResetToken | null> {
    let token = await this.tokenRepository.findValidToken(
      email,
      UserType.EMPLOYEE,
      otp,
      transaction,
    );
    if (!token) {
      token = await this.tokenRepository.findValidToken(
        email,
        UserType.USER,
        otp,
        transaction,
      );
    }
    return token;
  }

  /**
   * Request password reset — platform employee OR org user (password-based account).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; success: boolean }> {
    return this.transactionManager.execute(async (transaction) => {
      const employee = await this.employeesService.findByEmail(dto.email);

      if (employee) {
        if (employee.status !== EmployeeStatus.ACTIVE) {
          this.logger.warn(`Password reset requested for inactive employee: ${dto.email}`);
          return {
            message: 'A verification code has been sent to your email address',
            success: true,
          };
        }

        await this.issueOtpAndEmail(
          dto.email,
          UserType.EMPLOYEE,
          `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
          transaction,
        );
        this.logger.log(`Password reset OTP queued (employee): ${dto.email}`);
        return {
          message: 'A verification code has been sent to your email address',
          success: true,
        };
      }

      const user = await this.usersService.findByEmailOptional(dto.email);

      if (!user) {
        this.logger.warn(`Password reset requested for unknown email: ${dto.email}`);
        return {
          message: 'A verification code has been sent to your email address',
          success: true,
        };
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Password reset requested for inactive user: ${dto.email}`);
        return {
          message: 'A verification code has been sent to your email address',
          success: true,
        };
      }

      if (!user.passwordHash) {
        this.logger.warn(`Password reset requested for OAuth-only user (no password): ${dto.email}`);
        return {
          message: 'A verification code has been sent to your email address',
          success: true,
        };
      }

      await this.issueOtpAndEmail(
        dto.email,
        UserType.USER,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        transaction,
      );
      this.logger.log(`Password reset OTP queued (org user): ${dto.email}`);

      return {
        message: 'A verification code has been sent to your email address',
        success: true,
      };
    });
  }

  private async issueOtpAndEmail(
    email: string,
    userType: UserType,
    displayName: string,
    transaction: any,
  ): Promise<void> {
    const otp = this.cryptoUtilityService.generateOtp();
    const token = this.cryptoUtilityService.generateRandomString(32);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await this.tokenRepository.invalidateTokens(email, userType, transaction);
    await this.tokenRepository.createToken(
      email,
      userType,
      token,
      otp,
      expiresAt,
      transaction,
    );

    try {
      await this.emailQueue.sendPasswordResetOtpEmail(email, displayName, otp);
    } catch (error) {
      this.logger.error(`Failed to queue OTP email for ${email}:`, error);
    }
  }

  /**
   * Verify OTP and return opaque token for reset step
   */
  async verifyResetOtp(dto: VerifyResetOtpDto): Promise<{ message: string; success: boolean; token: string }> {
    const token = await this.findValidTokenForOtp(dto.email, dto.otp);

    if (!token) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (token.isExpired()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    if (!token.isValid(this.MAX_ATTEMPTS)) {
      throw new UnauthorizedException('Verification code has exceeded maximum attempts');
    }

    await this.tokenRepository.incrementAttempts(token.id);

    if (token.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid verification code');
    }

    return {
      message: 'Verification successful. You can now reset your password.',
      success: true,
      token: token.token,
    };
  }

  /**
   * Reset password after OTP verification
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string; success: boolean }> {
    return this.transactionManager.execute(async (transaction) => {
      const token = await this.findValidTokenForOtp(
        dto.email,
        dto.otp,
        transaction,
      );

      if (!token) {
        throw new UnauthorizedException('Invalid or expired verification code');
      }

      if (token.otp !== dto.otp) {
        await this.tokenRepository.incrementAttempts(token.id, transaction);
        throw new UnauthorizedException('Invalid verification code');
      }

      if (token.isExpired()) {
        throw new UnauthorizedException('Verification code has expired');
      }

      if (token.used) {
        throw new BadRequestException('This verification code has already been used');
      }

      if (token.userType === UserType.EMPLOYEE) {
        const employee = await this.employeesService.findByEmail(dto.email);
        if (!employee) {
          throw new NotFoundException('Employee not found');
        }
        if (employee.status !== EmployeeStatus.ACTIVE) {
          throw new BadRequestException('Employee account is not active');
        }
        await this.employeesService.updatePassword(employee.id, dto.newPassword, transaction);
        this.logger.log(`Password reset successful (employee): ${dto.email}`);
      } else {
        const user = await this.usersService.findByEmailOptional(dto.email);
        if (!user) {
          throw new NotFoundException('User not found');
        }
        if (user.status !== UserStatus.ACTIVE) {
          throw new BadRequestException('Account is not active');
        }
        await this.usersService.updatePasswordSelfService(
          user.id,
          dto.newPassword,
          transaction,
        );
        this.logger.log(`Password reset successful (org user): ${dto.email}`);
      }

      await this.tokenRepository.markAsUsed(token.id, transaction);

      return {
        message: 'Password has been reset successfully',
        success: true,
      };
    });
  }
}
