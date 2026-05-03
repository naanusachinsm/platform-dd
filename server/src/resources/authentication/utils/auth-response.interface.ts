import { UserRole } from 'src/common/enums/roles.enum';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: UserRole;
    organizationId: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
      domain?: string;
    };
  };
}

