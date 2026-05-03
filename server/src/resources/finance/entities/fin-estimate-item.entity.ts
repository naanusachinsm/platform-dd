import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { FinEstimate } from './fin-estimate.entity';
import { FinProduct } from './fin-product.entity';
import { FinTaxRate } from './fin-tax-rate.entity';

@Table({
  tableName: 'fin_estimate_items',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinEstimateItem extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @ForeignKey(() => FinEstimate)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  estimateId: string;

  @ForeignKey(() => FinProduct)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  productId: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 1 })
  quantity: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  unitPrice: number;

  @ForeignKey(() => FinTaxRate)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  taxRateId: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  taxAmount: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 0 })
  discountPercent: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  lineTotal: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sortOrder: number;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinEstimate)
  estimate: FinEstimate;

  @BelongsTo(() => FinProduct)
  product: FinProduct;

  @BelongsTo(() => FinTaxRate)
  taxRate: FinTaxRate;
}
