import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinProduct } from './entities/fin-product.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinProductRepository extends BaseRepository<FinProduct> {
  constructor(
    @InjectModel(FinProduct)
    productModel: typeof FinProduct,
    userContextService: UserContextService,
  ) {
    super(productModel, undefined, userContextService);
  }
}
