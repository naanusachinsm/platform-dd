import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { ProjectMember } from './project-member.entity';
import { Sprint } from './sprint.entity';
import { Ticket } from './ticket.entity';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Table({
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class Project extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  key: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
    defaultValue: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  leadUserId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  ticketSequence: number;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'leadUserId')
  lead: User;

  @BelongsTo(() => User, 'createdBy')
  creator: User;

  @HasMany(() => ProjectMember)
  members: ProjectMember[];

  @HasMany(() => Sprint)
  sprints: Sprint[];

  @HasMany(() => Ticket)
  tickets: Ticket[];
}
