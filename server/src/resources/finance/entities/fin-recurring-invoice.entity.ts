import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { FinInvoice } from './fin-invoice.entity';

export enum RecurringFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  YEARLY = 'YEARLY',
}

@Table({
  tableName: 'fin_recurring_invoices',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinRecurringInvoice extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @ForeignKey(() => FinInvoice)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  basedOnInvoiceId: string;

  @Column({
    type: DataType.ENUM(...Object.values(RecurringFrequency)),
    allowNull: false,
    defaultValue: RecurringFrequency.MONTHLY,
  })
  frequency: RecurringFrequency;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  nextIssueDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  endDate: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  autoSend: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  lastGeneratedAt: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  totalGenerated: number;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinInvoice)
  basedOnInvoice: FinInvoice;
}
