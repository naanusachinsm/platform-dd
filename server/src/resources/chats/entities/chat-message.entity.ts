import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { ChatRoom } from './chat-room.entity';

export enum ChatMessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  CALL = 'CALL',
}

@Table({
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      fields: ['chat_room_id', 'created_at'],
      name: 'idx_chat_messages_room_created',
    },
  ],
})
export class ChatMessage extends BaseEntity {
  @ForeignKey(() => ChatRoom)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  chatRoomId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  senderId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @Column({
    type: DataType.ENUM(...Object.values(ChatMessageType)),
    allowNull: false,
    defaultValue: ChatMessageType.TEXT,
  })
  type: ChatMessageType;

  @BelongsTo(() => ChatRoom)
  chatRoom: ChatRoom;

  @BelongsTo(() => User, 'senderId')
  sender: User;
}
