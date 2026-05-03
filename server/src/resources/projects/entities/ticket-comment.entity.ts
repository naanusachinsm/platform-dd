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
import { Ticket } from './ticket.entity';

@Table({
  tableName: 'ticket_comments',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['ticket_id', 'created_at'] },
  ],
})
export class TicketComment extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @ForeignKey(() => Ticket)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  ticketId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  authorId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => User, 'authorId')
  author: User;
}
