import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrAttendance } from './entities/hr-attendance.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrAttendanceRepository extends BaseRepository<HrAttendance> {
  constructor(
    @InjectModel(HrAttendance) model: typeof HrAttendance,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
