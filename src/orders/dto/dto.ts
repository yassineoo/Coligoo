// dto/order-filter.dto.ts
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';

export class OrderFilterDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filter by from city ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fromCityId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter by to city ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  toCityId?: number;

  @ApiPropertyOptional({
    example: '16',
    description: 'Filter by source wilaya code',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  fromWilayaCode?: string;

  @ApiPropertyOptional({
    example: '31',
    description: 'Filter by destination wilaya code',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  toWilayaCode?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by vendor/sender ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by deliveryman ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliverymanId?: number;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date filter',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'End date filter',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    example: 'search term',
    description: 'Search in order ID, customer name, phone',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by stop desk (pickup at hub)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isStopDesk?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter orders with exchange',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasExchange?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
    enum: ['createdAt', 'updatedAt', 'status', 'price', 'orderId', 'wilaya'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

class BulkUpdateDataDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliverymanId?: number;
}

export class BulkUpdateOrderDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of order IDs to update',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  orderIds: number[];

  @ApiProperty({ description: 'Data to update for all orders' })
  @ValidateNested()
  @Type(() => BulkUpdateDataDto)
  updateData: BulkUpdateDataDto;
}

export class AssignDeliverymanDto {
  @ApiProperty({ example: 1, description: 'ID of the deliveryman to assign' })
  @IsNumber()
  deliverymanId: number;
}

// interfaces/paginated-result.interface.ts
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}
