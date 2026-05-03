import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { FinTaxRate } from './fin-tax-rate.entity';

export enum ProductType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

@Table({
  tableName: 'fin_products',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinProduct extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProductType)),
    allowNull: false,
    defaultValue: ProductType.SERVICE,
  })
  type: ProductType;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  unitPrice: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  unit: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  sku: string;

  @ForeignKey(() => FinTaxRate)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  taxRateId: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinTaxRate)
  taxRate: FinTaxRate;
}
