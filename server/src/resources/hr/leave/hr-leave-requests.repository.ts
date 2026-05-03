import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrLeaveRequest } from './entities/hr-leave-request.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrLeaveRequestsRepository extends BaseRepository<HrLeaveRequest> {
  constructor(
    @InjectModel(HrLeaveRequest) model: typeof HrLeaveRequest,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
