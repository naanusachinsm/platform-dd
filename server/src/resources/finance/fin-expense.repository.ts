import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { InjectModel } from '@nestjs/sequelize';
import { FinExpense } from './entities/fin-expense.entity';
import { UserContextService } from 'src/common/services/user-context.service';

@Injectable()
export class FinExpenseRepository extends BaseRepository<FinExpense> {
  constructor(
    @InjectModel(FinExpense)
    expenseModel: typeof FinExpense,
    userContextService: UserContextService,
  ) {
    super(expenseModel, undefined, userContextService);
  }
}
