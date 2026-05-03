import { PartialType } from '@nestjs/mapped-types';
import { CreateHrAttendanceDto } from './create-hr-attendance.dto';

export class UpdateHrAttendanceDto extends PartialType(CreateHrAttendanceDto) {}
