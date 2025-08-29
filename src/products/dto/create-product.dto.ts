import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'GST2139'
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({
    description: 'Product alias/display name',
    example: 'watch'
  })
  @IsString()
  @IsNotEmpty()
  productAlias: string;

  @ApiProperty({
    enum: Category,
    description: 'Product category',
    example: Category.ELECTRONICS
  })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({
    description: 'Product description',
    example: 'Water resistant smartwatch'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 74.00,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Available quantity',
    example: 5,
    minimum: 0
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Whether product has variables/variations',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  hasVariables?: boolean = false;

  @ApiPropertyOptional({
    description: 'Product variables/variations as JSON',
    example: {
      "color": "Blue",
      "price": "74.00 Da",
      "quantity": "05"
    }
  })
  @IsObject()
  @IsOptional()
  variables?: any;

  @ApiPropertyOptional({
    description: 'Show alias name in order',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  showAliasInOrder?: boolean = false;
}
export class ProductFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: Category,
    example: Category.ELECTRONICS
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({
    description: 'Search by product name or alias',
    example: 'watch'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 0,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 1000,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}