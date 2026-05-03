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

export enum ProjectActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum ProjectEntityType {
  TICKET = 'TICKET',
  SPRINT = 'SPRINT',
  BOARD = 'BOARD',
  MEMBER = 'MEMBER',
  ASSET = 'ASSET',
}

@Table({
  tableName: 'project_activities',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['project_id', 'created_at'] },
  ],
})
export class ProjectActivity extends BaseEntity {
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
    type: DataType.ENUM(...Object.values(ProjectActivityAction)),
    allowNull: false,
  })
  action: ProjectActivityAction;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectEntityType)),
    allowNull: false,
  })
  entityType: ProjectEntityType;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  entityId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'performed_by_user_id',
  })
  performedByUserId: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  details: any;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'performedByUserId')
  performedByUser: User;
}
