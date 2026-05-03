import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { CrmCompany } from './crm-company.entity';

export enum ContactStatus {
  LEAD = 'LEAD',
  PROSPECT = 'PROSPECT',
  CUSTOMER = 'CUSTOMER',
  CHURNED = 'CHURNED',
}

export enum ContactSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  COLD_OUTREACH = 'COLD_OUTREACH',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

@Table({
  tableName: 'crm_contacts',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CrmContact extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => CrmCompany)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  companyId: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  lastName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  jobTitle: string;

  @Column({
    type: DataType.ENUM(...Object.values(ContactStatus)),
    allowNull: false,
    defaultValue: ContactStatus.LEAD,
  })
  status: ContactStatus;

  @Column({
    type: DataType.ENUM(...Object.values(ContactSource)),
    allowNull: true,
  })
  source: ContactSource;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastContactedAt: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  ownerId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmCompany)
  company: CrmCompany;

  @BelongsTo(() => User, 'ownerId')
  owner: User;
}
