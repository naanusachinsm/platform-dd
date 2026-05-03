import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrPayroll } from './entities/hr-payroll.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrPayrollRepository extends BaseRepository<HrPayroll> {
  constructor(
    @InjectModel(HrPayroll) model: typeof HrPayroll,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
