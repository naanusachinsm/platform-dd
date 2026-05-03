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

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  UPI = 'UPI',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

@Table({
  tableName: 'fin_invoice_payments',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinInvoicePayment extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @ForeignKey(() => FinInvoice)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  invoiceId: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  amount: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  paymentDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
    defaultValue: PaymentMethod.BANK_TRANSFER,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: DataType.STRING(255), allowNull: true })
  referenceNumber: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinInvoice)
  invoice: FinInvoice;
}
