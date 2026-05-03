import { SetMetadata } from '@nestjs/common';

export const PROJECT_ADMIN_ONLY_KEY = 'projectAdminOnly';

/**
 * Marks an endpoint as restricted to project ADMIN members only.
 * Used together with ProjectMemberGuard.
 * Regular MEMBER users will receive 403 on these endpoints.
 */
export const ProjectAdminOnly = () =>
  SetMetadata(PROJECT_ADMIN_ONLY_KEY, true);
