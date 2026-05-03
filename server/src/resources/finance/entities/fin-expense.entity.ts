import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { FinExpenseCategory } from './fin-expense-category.entity';
import { FinVendor } from './fin-vendor.entity';
import { Asset } from 'src/resources/assets/entities/asset.entity';
import { PaymentMethod } from './fin-invoice-payment.entity';

export enum RecurringExpenseFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum ReimbursementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REIMBURSED = 'REIMBURSED',
}

@Table({
  tableName: 'fin_expenses',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinExpense extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @ForeignKey(() => FinExpenseCategory)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  categoryId: string;

  @ForeignKey(() => FinVendor)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  vendorId: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  amount: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  expenseDate: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @ForeignKey(() => Asset)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  receiptAssetId: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: DataType.STRING(255), allowNull: true })
  referenceNumber: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isRecurring: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(RecurringExpenseFrequency)),
    allowNull: true,
  })
  recurringFrequency: RecurringExpenseFrequency;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isReimbursable: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(ReimbursementStatus)),
    allowNull: true,
  })
  reimbursementStatus: ReimbursementStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'INR' })
  currency: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinExpenseCategory)
  category: FinExpenseCategory;

  @BelongsTo(() => FinVendor)
  vendor: FinVendor;

  @BelongsTo(() => Asset)
  receiptAsset: Asset;
}
