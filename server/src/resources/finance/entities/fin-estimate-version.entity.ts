import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { FinEstimate } from './fin-estimate.entity';

@Table({
  tableName: 'fin_estimate_versions',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FinEstimateVersion extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  organizationId: string;

  @ForeignKey(() => FinEstimate)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  estimateId: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  version: number;

  @Column({ type: DataType.JSON, allowNull: false })
  snapshot: any;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => FinEstimate)
  estimate: FinEstimate;
}
