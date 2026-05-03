import { IsObject, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_SETTINGS_DEPTH = 5;
const MAX_SETTINGS_SIZE_BYTES = 64 * 1024;

function sanitizeSettings(obj: any, depth = 0): Record<string, any> {
  if (depth > MAX_SETTINGS_DEPTH || typeof obj !== 'object' || obj === null) {
    return {};
  }

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) continue;

    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeSettings(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class UpdateSettingsDto {
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'object') return value;

    const json = JSON.stringify(value);
    if (json.length > MAX_SETTINGS_SIZE_BYTES) {
      throw new Error('Settings payload too large');
    }

    return sanitizeSettings(value);
  })
  settings?: Record<string, any>;
}
