import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/resources/organizations/entities/organization.entity';
import { ChatRoomMember } from './chat-room-member.entity';
import { ChatMessage } from './chat-message.entity';

export enum ChatRoomType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

@Table({
  tableName: 'chat_rooms',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class ChatRoom extends BaseEntity {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  organizationId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  name: string;

  @Column({
    type: DataType.ENUM(...Object.values(ChatRoomType)),
    allowNull: false,
    defaultValue: ChatRoomType.DIRECT,
  })
  type: ChatRoomType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  avatarUrl: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastMessageAt: Date;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  lastMessagePreview: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @HasMany(() => ChatRoomMember)
  members: ChatRoomMember[];

  @HasMany(() => ChatMessage)
  messages: ChatMessage[];
}
