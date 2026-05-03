import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrDesignationStatus } from '../entities/hr-designation.entity';

export class HrDesignationQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrDesignationStatus)
  status?: HrDesignationStatus;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
