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

export enum HrAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
}

@Table({
  tableName: 'hr_attendance',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrAttendance extends BaseEntity {
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
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date: string;

  @Column({
    type: DataType.STRING(8),
    allowNull: true,
  })
  clockIn: string;

  @Column({
    type: DataType.STRING(8),
    allowNull: true,
  })
  clockOut: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  totalHours: number;

  @Column({
    type: DataType.ENUM(...Object.values(HrAttendanceStatus)),
    allowNull: false,
    defaultValue: HrAttendanceStatus.PRESENT,
  })
  status: HrAttendanceStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'userId')
  user: User;
}
