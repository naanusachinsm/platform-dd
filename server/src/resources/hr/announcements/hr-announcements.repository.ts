import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrAnnouncement } from './entities/hr-announcement.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrAnnouncementsRepository extends BaseRepository<HrAnnouncement> {
  constructor(
    @InjectModel(HrAnnouncement) model: typeof HrAnnouncement,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
