// src/shipping/dto/create-shipping-fee.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateShippingFeeDto {
  @ApiProperty({ example: '16', description: 'From wilaya code' })
  @IsString()
  fromWilayaCode: string;

  @ApiProperty({ example: '31', description: 'To wilaya code' })
  @IsString()
  toWilayaCode: string;

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

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
