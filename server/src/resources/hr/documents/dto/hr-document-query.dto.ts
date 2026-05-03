import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base.query.dto';
import { HrDocumentStatus, HrDocumentType } from '../entities/hr-document.entity';

export class HrDocumentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrDocumentStatus)
  status?: HrDocumentStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(HrDocumentType)
  documentType?: HrDocumentType;
}
