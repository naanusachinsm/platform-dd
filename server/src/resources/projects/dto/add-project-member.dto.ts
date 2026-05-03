import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ProjectMemberRole } from '../entities/project-member.entity';

export class AddProjectMemberDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole = ProjectMemberRole.MEMBER;
}
