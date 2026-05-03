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

export enum HrDepartmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Table({
  tableName: 'hr_departments',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrDepartment extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  organizationId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  headUserId: string;

  @ForeignKey(() => HrDepartment)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  parentDepartmentId: string;

  @Column({
    type: DataType.ENUM(...Object.values(HrDepartmentStatus)),
    allowNull: false,
    defaultValue: HrDepartmentStatus.ACTIVE,
  })
  status: HrDepartmentStatus;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'headUserId')
  headUser: User;

  @BelongsTo(() => HrDepartment, 'parentDepartmentId')
  parentDepartment: HrDepartment;
}
