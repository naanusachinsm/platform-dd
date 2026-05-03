import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class BaseQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 10;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return 10;
    return Math.min(parsed, 100);
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: 'Search term can only contain letters, numbers and spaces',
  })
  searchTerm?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
