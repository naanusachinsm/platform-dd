import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinVendor } from './entities/fin-vendor.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinVendorRepository extends BaseRepository<FinVendor> {
  constructor(
    @InjectModel(FinVendor)
    vendorModel: typeof FinVendor,
    userContextService: UserContextService,
  ) {
    super(vendorModel, undefined, userContextService);
  }
}
