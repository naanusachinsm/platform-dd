import { PartialType } from '@nestjs/mapped-types';
import { CreateHrPayrollDto } from './create-hr-payroll.dto';

export class UpdateHrPayrollDto extends PartialType(CreateHrPayrollDto) {}
