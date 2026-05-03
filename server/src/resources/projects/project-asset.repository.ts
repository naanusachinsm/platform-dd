import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectAsset } from './entities/project-asset.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class ProjectAssetRepository extends BaseRepository<ProjectAsset> {
  constructor(
    @InjectModel(ProjectAsset)
    projectAssetModel: typeof ProjectAsset,
    userContextService: UserContextService,
  ) {
    super(projectAssetModel, undefined, userContextService);
  }
}
