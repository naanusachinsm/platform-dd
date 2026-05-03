import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Project } from './project.entity';
import { Ticket } from './ticket.entity';

export enum SprintStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Table({
  tableName: 'sprints',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['project_id', 'status'] },
  ],
})
export class Sprint extends BaseEntity {
  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  projectId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  goal: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  startDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  endDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(SprintStatus)),
    allowNull: false,
    defaultValue: SprintStatus.PLANNING,
  })
  status: SprintStatus;

  @BelongsTo(() => Project)
  project: Project;

  @HasMany(() => Ticket)
  tickets: Ticket[];
}
