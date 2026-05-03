import { PartialType } from '@nestjs/mapped-types';
import { CreateHrAnnouncementDto } from './create-hr-announcement.dto';

export class UpdateHrAnnouncementDto extends PartialType(CreateHrAnnouncementDto) {}
