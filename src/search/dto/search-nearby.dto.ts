import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { SearchFilterDto } from './search-filter.dto';

export class SearchNearbyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  categoryId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  subCategoryId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  wilayaCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  cityId: number;

  @ApiProperty({ required: false, enum: ['true', 'false'] })
  @IsOptional()
  @IsBooleanString()
  homeService: string;

  @ApiProperty({ required: false, enum: ['true', 'false'] })
  @IsOptional()
  @IsBooleanString()
  hasVehicule: string;

  @ApiProperty({ required: false, enum: ['true', 'false'] })
  @IsOptional()
  @IsBooleanString()
  hasArtisanCard: string;
  /*
  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, enum: PerimetreDeTraveaux })
  @IsOptional()
  @IsEnum(PerimetreDeTraveaux)
  perimetreDeTraveaux: PerimetreDeTraveaux;
*/
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  expYears: number;
  /*
  @ApiProperty({ required: false, enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex: Sex;

  */

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  startAge: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  endAge: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  latitude: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  longitude: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  radius: string;
}
