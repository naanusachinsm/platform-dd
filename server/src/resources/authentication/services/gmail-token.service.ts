import { Injectable, Logger } from '@nestjs/common';
import { CryptoUtilityService } from 'src/common/services/crypto-utility.service';
import { GmailOAuthToken, GmailTokenStatus } from '../../users/entities/gmail-oauth-token.entity';
import { User } from '../../users/entities/user.entity';
import { SocialUserDataDto } from '../dto/social-user-data.dto';
import { TOKEN_EXPIRY } from '../utils/auth.constants';
import { Transaction } from 'sequelize';
import axios from 'axios';

export interface ScopeResponse {
  scopes: string[];
  hasEmail: boolean;
  hasProfile: boolean;
  hasGmailReadonly: boolean;
  hasGmailSend: boolean;
  hasAllGmailScopes: boolean;
  tokenStatus?: GmailTokenStatus;
  tokenEmail?: string;
  needsReAuth?: boolean;
}

const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];

@Injectable()
export class GmailTokenService {
  private readonly logger = new Logger(GmailTokenService.name);

  constructor(
    private readonly cryptoUtilityService: CryptoUtilityService,
  ) {}

  async ensureGmailToken(
    user: User,
    socialData: SocialUserDataDto,
    transaction: Transaction,
  ): Promise<void> {
    if (!socialData.accessToken || socialData.socialProvider !== 'google') {
      return;
    }

    const existingToken = await GmailOAuthToken.findOne({
      where: { userId: user.id },
      transaction,
    });

    const grantedScopes = socialData.scopes?.length > 0
      ? socialData.scopes
      : DEFAULT_SCOPES;

    if (existingToken) {
      await this.updateExistingToken(existingToken, socialData, transaction);
    } else {
      await this.createNewToken(user, socialData, grantedScopes, transaction);
    }
  }

  async getUserScopes(userId: string): Promise<ScopeResponse> {
    const token = await GmailOAuthToken.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (!token) {
      return this.buildScopeResponse([], undefined, undefined, true);
    }

    const needsReAuth = token.status === GmailTokenStatus.INVALID ||
                        token.status === GmailTokenStatus.REVOKED;

    if (needsReAuth) {
      return this.buildScopeResponse(
        token.scopes || [],
        token.status,
        token.email || undefined,
        true,
      );
    }

    const displayStatus = token.status === GmailTokenStatus.EXPIRED
      ? GmailTokenStatus.ACTIVE
      : token.status;

    return this.buildScopeResponse(
      token.scopes || [],
      displayStatus,
      token.email || undefined,
      false,
    );
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const token = await GmailOAuthToken.findOne({
      where: { userId, status: GmailTokenStatus.ACTIVE },
    });

    if (!token) {
      this.logger.warn(`No active token found for user ${userId} to revoke`);
      return;
    }

    try {
      const accessToken = await this.cryptoUtilityService.decrypt(
        token.accessTokenEncrypted,
      );

      try {
        await axios.post(
          'https://oauth2.googleapis.com/revoke',
          new URLSearchParams({ token: accessToken }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );
        this.logger.log(`Successfully revoked token at Google for user ${userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to revoke token at Google for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      token.status = GmailTokenStatus.REVOKED;
      token.revokedAt = new Date();
      await token.save();

      this.logger.log(`Successfully revoked tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to revoke tokens for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private buildScopeResponse(
    scopes: string[],
    tokenStatus: GmailTokenStatus | undefined,
    tokenEmail: string | undefined,
    needsReAuth: boolean,
  ): ScopeResponse {
    if (needsReAuth && !scopes.length) {
      return {
        scopes: [],
        hasEmail: false,
        hasProfile: false,
        hasGmailReadonly: false,
        hasGmailSend: false,
        hasAllGmailScopes: false,
        tokenStatus,
        tokenEmail,
        needsReAuth: true,
      };
    }

    if (needsReAuth) {
      return {
        scopes,
        hasEmail: false,
        hasProfile: false,
        hasGmailReadonly: false,
        hasGmailSend: false,
        hasAllGmailScopes: false,
        tokenStatus,
        tokenEmail,
        needsReAuth: true,
      };
    }

    const hasEmail = scopes.includes('email') ||
      scopes.includes('https://www.googleapis.com/auth/userinfo.email') ||
      scopes.includes('openid');
    const hasProfile = scopes.includes('profile') ||
      scopes.includes('https://www.googleapis.com/auth/userinfo.profile') ||
      scopes.includes('openid');
    const hasGmailReadonly = scopes.includes(GMAIL_READONLY_SCOPE);
    const hasGmailSend = scopes.includes(GMAIL_SEND_SCOPE);

    return {
      scopes,
      hasEmail,
      hasProfile,
      hasGmailReadonly,
      hasGmailSend,
      hasAllGmailScopes: hasGmailReadonly && hasGmailSend,
      tokenStatus,
      tokenEmail,
      needsReAuth: false,
    };
  }

  private async updateExistingToken(
    existingToken: GmailOAuthToken,
    socialData: SocialUserDataDto,
    transaction: Transaction,
  ): Promise<void> {
    existingToken.accessTokenEncrypted = await this.cryptoUtilityService.encrypt(
      socialData.accessToken,
    );
    if (socialData.refreshToken) {
      existingToken.refreshTokenEncrypted = await this.cryptoUtilityService.encrypt(
        socialData.refreshToken,
      );
    }

    const wasRevoked = existingToken.status === GmailTokenStatus.REVOKED;

    if (socialData.scopes?.length > 0) {
      if (wasRevoked) {
        existingToken.scopes = socialData.scopes;
      } else {
        const mergedScopes = [...new Set([...(existingToken.scopes || []), ...socialData.scopes])];
        existingToken.scopes = mergedScopes;
      }
    }

    const now = new Date();
    existingToken.tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN_MS);
    existingToken.lastUsedAt = now;
    existingToken.grantedAt = now;

    if (wasRevoked) {
      existingToken.status = GmailTokenStatus.ACTIVE;
      existingToken.revokedAt = null;
    }

    await existingToken.save({ transaction });
  }

  private async createNewToken(
    user: User,
    socialData: SocialUserDataDto,
    grantedScopes: string[],
    transaction: Transaction,
  ): Promise<void> {
    const quotaResetAt = new Date();
    quotaResetAt.setUTCDate(quotaResetAt.getUTCDate() + 1);
    quotaResetAt.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    await GmailOAuthToken.create(
      {
        userId: user.id,
        organizationId: user.organizationId ?? user.organization?.id,
        email: user.email,
        accessTokenEncrypted: await this.cryptoUtilityService.encrypt(socialData.accessToken),
        refreshTokenEncrypted: socialData.refreshToken
          ? await this.cryptoUtilityService.encrypt(socialData.refreshToken)
          : '',
        tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN_MS),
        scopes: grantedScopes,
        grantedAt: now,
        consentGivenAt: now,
        consentVersion: '1.0',
        dataRetentionUntil: new Date(Date.now() + TOKEN_EXPIRY.DATA_RETENTION_MS),
        status: 'ACTIVE',
        lastUsedAt: now,
        quotaResetAt,
        dailyQuotaUsed: 0,
      },
      { transaction },
    );
  }
}
