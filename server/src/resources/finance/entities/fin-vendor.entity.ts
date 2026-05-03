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

@Table({
  tableName: 'fin_vendors',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinVendor extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  email: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  address: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  city: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  state: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  country: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  postalCode: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  website: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @ForeignKey(() => CrmCompany)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  crmCompanyId: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmCompany)
  crmCompany: CrmCompany;
}
