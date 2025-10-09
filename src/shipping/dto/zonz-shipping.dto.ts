// src/shipping/dto/zone.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateShippingZoneDto {
  @ApiProperty({ example: 'Zone 1 - Centre Blida' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 600,
    description: 'Home delivery price for this zone',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 1,
    description: 'Shipping fee route ID',
  })
  @IsNumber()
  shippingFeeId: number;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'Array of city/commune IDs',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  cityIds: number[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateShippingZoneDto {
  @ApiProperty({ example: 'Zone 1 - Centre Blida', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 600, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  cityIds?: number[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryShippingZoneDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  shippingFeeId?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class BulkCreateZonesDto {
  @ApiProperty({
    example: 1,
    description: 'Shipping fee route ID',
  })
  @IsNumber()
  shippingFeeId: number;

  @ApiProperty({
    example: [
      {
        name: 'Zone 1 - Centre',
        price: 600,
        cityIds: [1, 2, 3, 4, 5],
      },
      {
        name: 'Zone 2 - Périphérie',
        price: 700,
        cityIds: [6, 7, 8, 9],
      },
    ],
    type: 'array',
  })
  @IsArray()
  @ArrayNotEmpty()
  zones: Array<{
    name: string;
    price: number;
    cityIds: number[];
  }>;
}
