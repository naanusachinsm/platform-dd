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
import { CrmContact } from './crm-contact.entity';
import { CrmCompany } from './crm-company.entity';

export enum DealStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum DealPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  [DealStage.LEAD]: 10,
  [DealStage.QUALIFIED]: 25,
  [DealStage.PROPOSAL]: 50,
  [DealStage.NEGOTIATION]: 75,
  [DealStage.CLOSED_WON]: 100,
  [DealStage.CLOSED_LOST]: 0,
};

@Table({
  tableName: 'crm_deals',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CrmDeal extends BaseEntity {
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

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
  })
  value: number;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  })
  currency: string;

  @Column({
    type: DataType.ENUM(...Object.values(DealStage)),
    allowNull: false,
    defaultValue: DealStage.LEAD,
  })
  stage: DealStage;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 10,
  })
  probability: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  expectedCloseDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  actualCloseDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(DealPriority)),
    allowNull: false,
    defaultValue: DealPriority.MEDIUM,
  })
  priority: DealPriority;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  position: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  ownerId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => CrmContact)
  contact: CrmContact;

  @BelongsTo(() => CrmCompany)
  company: CrmCompany;

  @BelongsTo(() => User, 'ownerId')
  owner: User;
}
