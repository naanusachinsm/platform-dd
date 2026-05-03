import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrDepartmentStatus } from '../entities/hr-department.entity';

export class HrDepartmentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrDepartmentStatus)
  status?: HrDepartmentStatus;
}
