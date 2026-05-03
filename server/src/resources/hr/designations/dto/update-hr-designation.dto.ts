import { PartialType } from '@nestjs/mapped-types';
import { CreateHrDesignationDto } from './create-hr-designation.dto';

export class UpdateHrDesignationDto extends PartialType(CreateHrDesignationDto) {}
