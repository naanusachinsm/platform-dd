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
import { FinInvoice, DiscountType } from './fin-invoice.entity';

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
}

@Table({
  tableName: 'fin_estimates',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinEstimate extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  estimateNumber: string;

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
    type: DataType.ENUM(...Object.values(EstimateStatus)),
    allowNull: false,
    defaultValue: EstimateStatus.DRAFT,
  })
  status: EstimateStatus;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  issueDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  validUntil: string;

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

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  version: number;

  @ForeignKey(() => FinInvoice)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  convertedInvoiceId: string;

  @Column({ type: DataType.DATE, allowNull: true })
  sentAt: string;

  @Column({ type: DataType.DATE, allowNull: true })
  viewedAt: string;

  @Column({ type: DataType.DATE, allowNull: true })
  acceptedAt: string;

  @Column({ type: DataType.DATE, allowNull: true })
  rejectedAt: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmCompany)
  crmCompany: CrmCompany;

  @BelongsTo(() => CrmContact)
  crmContact: CrmContact;

  @BelongsTo(() => CrmDeal)
  crmDeal: CrmDeal;

  @BelongsTo(() => FinInvoice)
  convertedInvoice: FinInvoice;
}
