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
import { HrLeaveType } from './hr-leave-type.entity';

@Table({
  tableName: 'hr_leave_balances',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrLeaveBalance extends BaseEntity {
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

  @ForeignKey(() => HrLeaveType)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  leaveTypeId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year: number;

  @Column({
    type: DataType.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
  })
  totalDays: number;

  @Column({
    type: DataType.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
  })
  usedDays: number;

  @Column({
    type: DataType.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
  })
  remainingDays: number;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'userId')
  user: User;

  @BelongsTo(() => HrLeaveType, 'leaveTypeId')
  leaveType: HrLeaveType;
}
