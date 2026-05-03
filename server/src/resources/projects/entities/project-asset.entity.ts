import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { Project } from './project.entity';

@Table({
  tableName: 'project_assets',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class ProjectAsset extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  projectId: string;

  @Column({
    type: DataType.STRING(2048),
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  filename: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  originalname: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  mimetype: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  size: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'uploaded_by_user_id',
  })
  uploadedByUserId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'uploadedByUserId')
  uploadedByUser: User;
}
