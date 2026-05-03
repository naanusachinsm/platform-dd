import { IsOptional, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { ProjectStatus } from '../entities/project.entity';

export class ProjectQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
