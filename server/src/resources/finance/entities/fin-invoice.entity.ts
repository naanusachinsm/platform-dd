import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { CrmCompany } from 'src/resources/crm/entities/crm-company.entity';
import { CrmContact } from 'src/resources/crm/entities/crm-contact.entity';
import { CrmDeal } from 'src/resources/crm/entities/crm-deal.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Table({
  tableName: 'fin_invoices',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinInvoice extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  invoiceNumber: string;

  @ForeignKey(() => CrmCompany)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  crmCompanyId: string;

  @ForeignKey(() => CrmContact)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  crmContactId: string;

  @ForeignKey(() => CrmDeal)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  crmDealId: string;

  @Column({
    type: DataType.ENUM(...Object.values(InvoiceStatus)),
    allowNull: false,
    defaultValue: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  issueDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  dueDate: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  subtotal: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  taxTotal: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  discountAmount: number;

  @Column({
    type: DataType.ENUM(...Object.values(DiscountType)),
    allowNull: true,
  })
  discountType: DiscountType;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  total: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  amountPaid: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  amountDue: number;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'INR' })
  currency: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  terms: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  customerName: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  customerEmail: string;

  @Column({ type: DataType.DATE, allowNull: true })
  sentAt: string;

  @Column({ type: DataType.DATE, allowNull: true })
  viewedAt: string;

  @Column({ type: DataType.DATE, allowNull: true })
  paidAt: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmCompany)
  crmCompany: CrmCompany;

  @BelongsTo(() => CrmContact)
  crmContact: CrmContact;

  @BelongsTo(() => CrmDeal)
  crmDeal: CrmDeal;
}
