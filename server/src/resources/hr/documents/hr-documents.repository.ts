import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { HrDocument } from './entities/hr-document.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class HrDocumentsRepository extends BaseRepository<HrDocument> {
  constructor(
    @InjectModel(HrDocument) model: typeof HrDocument,
    userContextService: UserContextService,
  ) {
    super(model, undefined, userContextService);
  }
}
