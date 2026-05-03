import { PartialType } from '@nestjs/mapped-types';
import { CreateHrDepartmentDto } from './create-hr-department.dto';

export class UpdateHrDepartmentDto extends PartialType(CreateHrDepartmentDto) {}
