import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectAssetRepository } from '../project-asset.repository';
import { ProjectAsset } from '../entities/project-asset.entity';
import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { UserContextService } from 'src/common/services/user-context.service';
import { UserRole } from 'src/common/enums/roles.enum';
import { ProjectActivityService } from './project-activity.service';
import { ProjectActivityAction, ProjectEntityType } from '../entities/project-activity.entity';

@Injectable()
export class ProjectAssetService {
  constructor(
    private readonly assetRepository: ProjectAssetRepository,
    private readonly userContextService: UserContextService,
    private readonly projectActivityService: ProjectActivityService,
    @InjectModel(ProjectMember)
    private readonly projectMemberModel: typeof ProjectMember,
  ) {}

  async findAll(projectId: string) {
    const user = this.userContextService.getCurrentUser();
    const where: any = { projectId };

    if (user?.role !== UserRole.SUPERADMIN) {
      const member = await this.projectMemberModel.findOne({
        where: { projectId, userId: user?.sub, deletedAt: null },
        attributes: ['role'],
      });

      if (member?.role !== ProjectMemberRole.ADMIN) {
        where.uploadedByUserId = user?.sub;
      }
    }

    return this.assetRepository.findAll({
      where,
      pagination: { page: 1, limit: 500, sortBy: 'createdAt', sortOrder: 'DESC' },
      include: [
        { model: User, as: 'uploadedByUser', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] },
      ],
      bypassTenantFilter: true,
    });
  }

  async create(projectId: string, fileData: {
    url: string;
    filename: string;
    originalname: string;
    mimetype?: string;
    size?: number;
  }) {
    const user = this.userContextService.getCurrentUser();
    const asset = await this.assetRepository.create({
      projectId,
      organizationId: user?.organizationId,
      uploadedByUserId: user?.sub,
      ...fileData,
    } as any);

    this.projectActivityService.log(
      projectId,
      ProjectActivityAction.CREATE,
      ProjectEntityType.ASSET,
      `Uploaded asset "${fileData.originalname}"`,
      (asset as any).id,
      { filename: fileData.originalname, mimetype: fileData.mimetype, size: fileData.size },
    );

    return asset;
  }

  async remove(projectId: string, id: string) {
    const asset = await this.assetRepository.findById(id) as any;
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.projectId !== projectId) throw new NotFoundException('Asset not found in this project');

    this.projectActivityService.log(
      asset.projectId,
      ProjectActivityAction.DELETE,
      ProjectEntityType.ASSET,
      `Deleted asset "${asset.originalname}"`,
      id,
    );

    return this.assetRepository.delete({ id } as any);
  }
}
