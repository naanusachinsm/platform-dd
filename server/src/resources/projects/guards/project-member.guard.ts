import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
import { JwtPayload } from 'src/configuration/jwt/interfaces/jwt-payload.interface';
import { UserRole } from 'src/common/enums/roles.enum';
import { PROJECT_ADMIN_ONLY_KEY } from './project-admin-only.decorator';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(ProjectMember)
    private projectMemberModel: typeof ProjectMember,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    const projectId = request.params?.projectId;

    if (!projectId) {
      return true;
    }

    if (!user?.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    const member = await this.projectMemberModel.findOne({
      where: { projectId, userId: user.sub, deletedAt: null },
      attributes: ['role'],
    });

    if (!member) {
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(
      PROJECT_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isAdminOnly && member.role !== ProjectMemberRole.ADMIN) {
      throw new ForbiddenException(
        'Only project admins can perform this action',
      );
    }

    return true;
  }
}
