import { IsString, MinLength, MaxLength, IsOptional, IsInt, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBoardColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;
}

export class UpdateBoardColumnDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;
}

export class ReorderColumnsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  columnIds: string[];
}
