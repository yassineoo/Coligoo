import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../entities/order.entity';

export class OrderItemsDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Product ID - unique identifier for the product' 
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ 
    example: 'كتاب الطبخ المغربي', 
    description: 'Product name or description' 
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ 
    example: 2, 
    description: 'Quantity of the product' 
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ 
    example: 1200, 
    description: 'Price per unit in DA' 
  })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({ 
    example: 2400, 
    description: 'Total price for this item (unitPrice * quantity)' 
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalPrice?: number;

  @ApiPropertyOptional({ 
    example: 'XL', 
    description: 'Product size if applicable' 
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ 
    example: 'أحمر', 
    description: 'Product color if applicable' 
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ 
    example: 'مع تغليف خاص', 
    description: 'Special notes for this item' 
  })
  @IsOptional()
  @IsString()
  itemNote?: string;
}

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

  @ApiProperty({ 
    example: 'كتب الطبخ', 
    description: 'Legacy product list string - use orderItems instead' 
  })
  @IsOptional()
  @IsString()
  productList?: string;

  @ApiProperty({ 
    type: [OrderItemsDto],
    description: 'Array of order items with detailed product information',
    example: [
      {
        productId: 1,
        productName: 'كتاب الطبخ المغربي',
        quantity: 2,
        unitPrice: 1200,
        totalPrice: 2400,
        size: 'XL',
        color: 'أحمر',
        itemNote: 'مع تغليف خاص'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemsDto)
  orderItems: OrderItemsDto[];

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