import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinEstimateVersion } from './entities/fin-estimate-version.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinEstimateVersionRepository extends BaseRepository<FinEstimateVersion> {
  constructor(
    @InjectModel(FinEstimateVersion)
    model: typeof FinEstimateVersion,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
