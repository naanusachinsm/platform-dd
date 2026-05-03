import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { CrmContact } from './crm-contact.entity';
import { CrmCompany } from './crm-company.entity';
import { CrmDeal } from './crm-deal.entity';

export enum ActivityType {
  NOTE = 'NOTE',
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'crm_activities',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CrmActivity extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => CrmContact)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  contactId: string;

  @ForeignKey(() => CrmCompany)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  companyId: string;

  @ForeignKey(() => CrmDeal)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  dealId: string;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityType)),
    allowNull: false,
  })
  type: ActivityType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  subject: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  activityDate: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  durationMinutes: number;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityStatus)),
    allowNull: false,
    defaultValue: ActivityStatus.COMPLETED,
  })
  status: ActivityStatus;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  dueDate: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isReminder: boolean;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmContact)
  contact: CrmContact;

  @BelongsTo(() => CrmCompany)
  company: CrmCompany;

  @BelongsTo(() => CrmDeal)
  deal: CrmDeal;
}
