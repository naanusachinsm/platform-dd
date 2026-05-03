import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from './entities/project.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ProjectRepository extends BaseRepository<Project> {
  constructor(
    @InjectModel(Project)
    projectModel: typeof Project,
    userContextService: UserContextService,
  ) {
    super(projectModel, undefined, userContextService);
  }
}
