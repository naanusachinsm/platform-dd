import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { HrDepartment } from 'src/resources/hr/departments/entities/hr-department.entity';

export enum HrDesignationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Table({
  tableName: 'hr_designations',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrDesignation extends BaseEntity {
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

  @ForeignKey(() => HrDepartment)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  departmentId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  level: number;

  @Column({
    type: DataType.ENUM(...Object.values(HrDesignationStatus)),
    allowNull: false,
    defaultValue: HrDesignationStatus.ACTIVE,
  })
  status: HrDesignationStatus;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => HrDepartment, 'departmentId')
  department: HrDepartment;
}
