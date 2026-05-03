import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { CrmContact } from './entities/crm-contact.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class CrmContactRepository extends BaseRepository<CrmContact> {
  constructor(
    @InjectModel(CrmContact)
    contactModel: typeof CrmContact,
    userContextService: UserContextService,
  ) {
    super(contactModel, undefined, userContextService);
  }
}
