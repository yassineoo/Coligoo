import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { PaymentType } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ example: 'MySecondOrder' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'رفيدة' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'بن مهيدي' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;


  @ApiProperty({ example: '0123456789' })
  @IsOptional()
  contactPhone2?: string;

  @ApiProperty({ example: 'حي الياسمين' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'he can open it first ' })
  @IsOptional()
  note: string;

  @ApiProperty({ example: 1, description: 'From city ID (wilaya)' })
  @IsNumber()
  @IsNotEmpty()
  fromCityId: number;

  @ApiProperty({ example: 2, description: 'To city ID (commune/wilaya)' })
  @IsNumber()
  @IsNotEmpty()
  toCityId: number;

  @ApiProperty({ example: 'كتب الطبخ' })
  @IsString()
  @IsNotEmpty()
  productList: string;

  @ApiProperty({ example: 2400 })
  @IsNumber()
  @IsPositive()
  price: number;

  // -------- Optional fields --------

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isStopDesk?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasExchange?: boolean;

  @ApiPropertyOptional({ enum: PaymentType, example: PaymentType.COD })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;
}
