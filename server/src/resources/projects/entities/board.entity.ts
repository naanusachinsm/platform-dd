import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { Project } from './project.entity';

@Table({
  tableName: 'boards',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['project_id', 'position'] },
  ],
})
export class Board extends BaseEntity {
  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  projectId: string;

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
    type: DataType.CHAR(36),
    allowNull: true,
  })
  filterSprintId: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  filterType: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  filterPriority: string;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  filterAssigneeId: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  filterLabels: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isDefault: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  position: number;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => Organization)
  organization: Organization;
}
