import { BadRequestException } from '@nestjs/common';

/**
 * Validates email format and domain presence
 */
export function validateEmailDomain(email: string): void {
  if (!email) {
    throw new BadRequestException('Email is required');
  }

  const emailDomain = email.split('@')[1];

  if (!emailDomain) {
    throw new BadRequestException('Invalid email format');
  }
}

