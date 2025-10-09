import { PartialType } from '@nestjs/swagger';
import { CreateShippingFeeDto } from './create-shipping.dto';

export class UpdateShippingFeeDto extends PartialType(CreateShippingFeeDto) {}

// src/shipping/dto/query-shipping-fee.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
// src/shipping/dto/set-all-prices.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryShippingFeeDto {
  @ApiPropertyOptional({ example: '16', description: 'Filter by from wilaya' })
  @IsString()
  @IsOptional()
  fromWilayaCode?: string;

  @ApiPropertyOptional({ example: '31', description: 'Filter by to wilaya' })
  @IsString()
  @IsOptional()
  toWilayaCode?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class SetAllPricesDto {
  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0)
  desktopPrice: number;

  @ApiProperty({ example: 600 })
  @IsNumber()
  @Min(0)
  homePrice: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  returnPrice: number;
}
