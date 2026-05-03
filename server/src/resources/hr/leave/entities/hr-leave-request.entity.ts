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

export enum HrLeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'hr_leave_requests',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrLeaveRequest extends BaseEntity {
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
    type: DataType.DATEONLY,
    allowNull: false,
  })
  startDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  endDate: string;

  @Column({
    type: DataType.DECIMAL(5, 1),
    allowNull: false,
  })
  daysCount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  reason: string;

  @Column({
    type: DataType.ENUM(...Object.values(HrLeaveRequestStatus)),
    allowNull: false,
    defaultValue: HrLeaveRequestStatus.PENDING,
  })
  status: HrLeaveRequestStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  approvedBy: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approvedAt: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remarks: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'userId')
  user: User;

  @BelongsTo(() => HrLeaveType, 'leaveTypeId')
  leaveType: HrLeaveType;

  @BelongsTo(() => User, 'approvedBy')
  approver: User;
}
