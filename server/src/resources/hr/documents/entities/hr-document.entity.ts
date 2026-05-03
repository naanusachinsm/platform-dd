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

export enum HrDocumentType {
  OFFER_LETTER = 'OFFER_LETTER',
  ID_PROOF = 'ID_PROOF',
  RESUME = 'RESUME',
  CONTRACT = 'CONTRACT',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER',
}

export enum HrDocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Table({
  tableName: 'hr_documents',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HrDocument extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  userId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.ENUM(...Object.values(HrDocumentType)),
    allowNull: false,
    defaultValue: HrDocumentType.OTHER,
  })
  documentType: HrDocumentType;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  fileUrl: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  fileName: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  fileSize: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPublic: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(HrDocumentStatus)),
    allowNull: false,
    defaultValue: HrDocumentStatus.ACTIVE,
  })
  status: HrDocumentStatus;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User, 'userId')
  user: User;
}
