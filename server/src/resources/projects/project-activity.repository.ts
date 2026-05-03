import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectActivity } from './entities/project-activity.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ProjectActivityRepository extends BaseRepository<ProjectActivity> {
  constructor(
    @InjectModel(ProjectActivity)
    projectActivityModel: typeof ProjectActivity,
    userContextService: UserContextService,
  ) {
    super(projectActivityModel, undefined, userContextService);
  }
}
