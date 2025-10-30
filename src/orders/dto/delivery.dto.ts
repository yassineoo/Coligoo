// DTO
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeliveryFilterType {
  ALL = 'all',
  ASSIGNED = 'assigned',
  DELIVERED = 'delivered',
  COLLECTED = 'collected',
}

export class DeliverymanOrderFilterDto {
  @ApiPropertyOptional({
    enum: DeliveryFilterType,
    default: DeliveryFilterType.ALL,
  })
  @IsOptional()
  @IsEnum(DeliveryFilterType)
  filter?: DeliveryFilterType = DeliveryFilterType.ALL;

  @ApiPropertyOptional({
    description: 'Search by order ID, city, wilaya, or client name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  limit?: number = 10;
}
