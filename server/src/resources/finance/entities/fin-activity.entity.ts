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

export enum FinActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  CONVERT = 'CONVERT',
  PAYMENT = 'PAYMENT',
}

export enum FinEntityType {
  INVOICE = 'INVOICE',
  ESTIMATE = 'ESTIMATE',
  PRODUCT = 'PRODUCT',
  VENDOR = 'VENDOR',
  EXPENSE = 'EXPENSE',
  EXPENSE_CATEGORY = 'EXPENSE_CATEGORY',
  TAX_RATE = 'TAX_RATE',
  RECURRING_INVOICE = 'RECURRING_INVOICE',
}

@Table({
  tableName: 'fin_activities',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinActivity extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({
    type: DataType.ENUM(...Object.values(FinActivityAction)),
    allowNull: false,
  })
  action: FinActivityAction;

  @Column({
    type: DataType.ENUM(...Object.values(FinEntityType)),
    allowNull: false,
  })
  entityType: FinEntityType;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  entityId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  performedByUserId: string;

  @Column({ type: DataType.JSON, allowNull: true })
  details: any;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User)
  performedByUser: User;
}
