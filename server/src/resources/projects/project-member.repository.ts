import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMember } from './entities/project-member.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ProjectMemberRepository extends BaseRepository<ProjectMember> {
  constructor(
    @InjectModel(ProjectMember)
    projectMemberModel: typeof ProjectMember,
    userContextService: UserContextService,
  ) {
    super(projectMemberModel, undefined, userContextService);
  }
}
