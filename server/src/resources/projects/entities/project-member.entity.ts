import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { Project } from './project.entity';

export enum ProjectMemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Table({
  tableName: 'project_members',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'user_id'],
      where: { deleted_at: null },
      name: 'unique_project_user',
    },
  ],
})
export class ProjectMember extends BaseEntity {
  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  projectId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectMemberRole)),
    allowNull: false,
    defaultValue: ProjectMemberRole.MEMBER,
  })
  role: ProjectMemberRole;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User)
  user: User;
}
