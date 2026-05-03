import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinExpenseCategory } from './entities/fin-expense-category.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinExpenseCategoryRepository extends BaseRepository<FinExpenseCategory> {
  constructor(
    @InjectModel(FinExpenseCategory)
    expenseCategoryModel: typeof FinExpenseCategory,
    userContextService: UserContextService,
  ) {
    super(expenseCategoryModel, undefined, userContextService);
  }
}
