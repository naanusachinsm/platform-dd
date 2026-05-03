import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrLeaveBalance } from './entities/hr-leave-balance.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrLeaveBalancesRepository extends BaseRepository<HrLeaveBalance> {
  constructor(
    @InjectModel(HrLeaveBalance) model: typeof HrLeaveBalance,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
