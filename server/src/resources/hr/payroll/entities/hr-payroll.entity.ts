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

export enum HrPayrollStatus {
  DRAFT = 'DRAFT',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
}

@Table({
  tableName: 'hr_payroll',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrPayroll extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  userId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  month: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  basicSalary: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  allowances: object;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  deductions: object;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  grossSalary: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  netSalary: number;

  @Column({
    type: DataType.ENUM(...Object.values(HrPayrollStatus)),
    allowNull: false,
    defaultValue: HrPayrollStatus.DRAFT,
  })
  status: HrPayrollStatus;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  paidAt: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'userId')
  user: User;
}
