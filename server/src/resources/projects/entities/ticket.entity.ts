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
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';
import { BoardColumn } from './board-column.entity';

export enum TicketType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
}

export enum TicketPriority {
  HIGHEST = 'HIGHEST',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  LOWEST = 'LOWEST',
}

export enum TicketResolution {
  UNRESOLVED = 'UNRESOLVED',
  DONE = 'DONE',
  WONT_DO = 'WONT_DO',
  DUPLICATE = 'DUPLICATE',
  CANNOT_REPRODUCE = 'CANNOT_REPRODUCE',
}

@Table({
  tableName: 'tickets',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['project_id', 'column_id'] },
    { fields: ['project_id', 'sprint_id'] },
    { fields: ['project_id', 'assignee_id'] },
    { fields: ['project_id', 'ticket_number'], unique: true },
  ],
})
export class Ticket extends BaseEntity {
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
    type: DataType.STRING(20),
    allowNull: false,
  })
  ticketKey: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  ticketNumber: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(TicketType)),
    allowNull: false,
    defaultValue: TicketType.TASK,
  })
  type: TicketType;

  @Column({
    type: DataType.ENUM(...Object.values(TicketPriority)),
    allowNull: false,
    defaultValue: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @ForeignKey(() => BoardColumn)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  columnId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  assigneeId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  reporterId: string;

  @ForeignKey(() => Sprint)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  sprintId: string;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  parentId: string;

  @Column({
    type: DataType.ENUM(...Object.values(TicketResolution)),
    allowNull: false,
    defaultValue: TicketResolution.UNRESOLVED,
  })
  resolution: TicketResolution;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  storyPoints: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  dueDate: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  labels: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  position: number;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => BoardColumn)
  column: BoardColumn;

  @BelongsTo(() => User, 'assigneeId')
  assignee: User;

  @BelongsTo(() => User, 'reporterId')
  reporter: User;

  @BelongsTo(() => Sprint)
  sprint: Sprint;

  @BelongsTo(() => Ticket, 'parentId')
  parent: Ticket;

  @HasMany(() => Ticket, 'parentId')
  children: Ticket[];
}
