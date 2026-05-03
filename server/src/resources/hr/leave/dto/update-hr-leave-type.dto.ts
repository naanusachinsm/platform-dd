import { PartialType } from '@nestjs/mapped-types';
import { CreateHrLeaveTypeDto } from './create-hr-leave-type.dto';

export class UpdateHrLeaveTypeDto extends PartialType(CreateHrLeaveTypeDto) {}
