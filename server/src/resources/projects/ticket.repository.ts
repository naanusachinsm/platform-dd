import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Ticket } from './entities/ticket.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class TicketRepository extends BaseRepository<Ticket> {
  constructor(
    @InjectModel(Ticket)
    ticketModel: typeof Ticket,
    userContextService: UserContextService,
  ) {
    super(ticketModel, undefined, userContextService);
  }
}
