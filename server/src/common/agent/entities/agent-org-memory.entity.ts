import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';

export enum OrgMemoryCategory {
  TERMINOLOGY = 'TERMINOLOGY',
  WORKFLOW = 'WORKFLOW',
  BUSINESS_RULE = 'BUSINESS_RULE',
  KNOWLEDGE = 'KNOWLEDGE',
}

@Table({
  tableName: 'agent_org_memories',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class AgentOrgMemory extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({
    type: DataType.ENUM(...Object.values(OrgMemoryCategory)),
    allowNull: false,
  })
  category: OrgMemoryCategory;

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 1.0 })
  relevanceScore: number;

  @Column({ type: DataType.DATE, allowNull: true })
  lastAccessedAt: Date;

  @BelongsTo(() => Organization)
  organization: Organization;
}
