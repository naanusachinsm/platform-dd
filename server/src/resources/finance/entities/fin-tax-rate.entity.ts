import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';

export enum TaxRateType {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  CUSTOM = 'CUSTOM',
}

@Table({
  tableName: 'fin_tax_rates',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinTaxRate extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  rate: number;

  @Column({
    type: DataType.ENUM(...Object.values(TaxRateType)),
    allowNull: false,
    defaultValue: TaxRateType.CUSTOM,
  })
  type: TaxRateType;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isDefault: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Organization)
  organization: Organization;
}
