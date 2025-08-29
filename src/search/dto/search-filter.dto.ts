import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { FilterDto } from 'src/common/filters/filter.dto';

export class SearchFilterDto extends FilterDto {}
