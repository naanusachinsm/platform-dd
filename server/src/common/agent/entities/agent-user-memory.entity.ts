import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';

export enum UserMemoryCategory {
  PREFERENCE = 'PREFERENCE',
  SHORTCUT = 'SHORTCUT',
  FACT = 'FACT',
  PATTERN = 'PATTERN',
  CONTEXT = 'CONTEXT',
}

@Table({
  tableName: 'agent_user_memories',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class AgentUserMemory extends BaseEntity {
  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  userId: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserMemoryCategory)),
    allowNull: false,
  })
  category: UserMemoryCategory;

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string;

  @Column({ type: DataType.STRING(36), allowNull: true })
  sourceConversationId: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 1.0 })
  relevanceScore: number;

  @Column({ type: DataType.DATE, allowNull: true })
  lastAccessedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Organization)
  organization: Organization;
}
