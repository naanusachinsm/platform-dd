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

export enum CrmAuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  STAGE_CHANGE = 'STAGE_CHANGE',
}

export enum CrmAuditEntityType {
  COMPANY = 'COMPANY',
  CONTACT = 'CONTACT',
  DEAL = 'DEAL',
}

@Table({
  tableName: 'crm_audit_activities',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CrmAuditActivity extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({
    type: DataType.ENUM(...Object.values(CrmAuditAction)),
    allowNull: false,
  })
  action: CrmAuditAction;

  @Column({
    type: DataType.ENUM(...Object.values(CrmAuditEntityType)),
    allowNull: false,
  })
  entityType: CrmAuditEntityType;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  entityId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  performedByUserId: string;

  @Column({ type: DataType.JSON, allowNull: true })
  details: any;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => User)
  performedByUser: User;
}
