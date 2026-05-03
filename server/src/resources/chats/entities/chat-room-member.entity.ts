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

export enum ChatMemberRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

@Table({
  tableName: 'chat_room_members',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['chat_room_id', 'user_id'],
      where: { deleted_at: null },
      name: 'unique_chat_room_user',
    },
  ],
})
export class ChatRoomMember extends BaseEntity {
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
  userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(ChatMemberRole)),
    allowNull: false,
    defaultValue: ChatMemberRole.MEMBER,
  })
  role: ChatMemberRole;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastReadAt: Date;

  @BelongsTo(() => ChatRoom)
  chatRoom: ChatRoom;

  @BelongsTo(() => User)
  user: User;
}
