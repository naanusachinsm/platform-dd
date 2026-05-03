import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';

export enum CompanySize {
  STARTUP = 'STARTUP',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Table({
  tableName: 'crm_companies',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CrmCompany extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  industry: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  website: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  state: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  country: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  postalCode: string;

  @Column({
    type: DataType.ENUM(...Object.values(CompanySize)),
    allowNull: true,
  })
  size: CompanySize;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
  })
  annualRevenue: number;

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatus)),
    allowNull: false,
    defaultValue: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @BelongsTo(() => Organization)
  organization: Organization;
}
