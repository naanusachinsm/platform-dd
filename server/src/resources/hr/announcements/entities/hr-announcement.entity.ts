import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';

export enum HrAnnouncementType {
  GENERAL = 'GENERAL',
  POLICY = 'POLICY',
  EVENT = 'EVENT',
  HOLIDAY = 'HOLIDAY',
}

export enum HrAnnouncementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum HrAnnouncementStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Table({
  tableName: 'hr_announcements',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrAnnouncement extends BaseEntity {
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
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @Column({
    type: DataType.ENUM(...Object.values(HrAnnouncementType)),
    allowNull: false,
    defaultValue: HrAnnouncementType.GENERAL,
  })
  type: HrAnnouncementType;

  @Column({
    type: DataType.ENUM(...Object.values(HrAnnouncementPriority)),
    allowNull: false,
    defaultValue: HrAnnouncementPriority.MEDIUM,
  })
  priority: HrAnnouncementPriority;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  publishedAt: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  expiresAt: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPinned: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(HrAnnouncementStatus)),
    allowNull: false,
    defaultValue: HrAnnouncementStatus.DRAFT,
  })
  status: HrAnnouncementStatus;

  @BelongsTo(() => Organization)
  organization: Organization;
}
