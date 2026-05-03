import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { TicketComment } from './entities/ticket-comment.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class TicketCommentRepository extends BaseRepository<TicketComment> {
  constructor(
    @InjectModel(TicketComment)
    ticketCommentModel: typeof TicketComment,
    userContextService: UserContextService,
  ) {
    super(ticketCommentModel, undefined, userContextService);
  }
}
