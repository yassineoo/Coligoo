// src/orders/dto/scan-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ScanOrderDto {
  @ApiProperty({
    example: 'ORD-2025-001',
    description: 'Order tracking code (orderId)',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class BulkDepositOrdersDto {
  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'Array of order IDs to deposit at hub',
    type: [Number],
  })
  @IsNotEmpty()
  orderIds: number[];
}

export class ScanResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Order found and ready for deposit' })
  message: string;

  @ApiProperty({ description: 'Order details if found' })
  order?: any;
}

export class BulkDepositResultDto {
  @ApiProperty({
    example: 5,
    description: 'Number of orders successfully deposited',
  })
  successCount: number;

  @ApiProperty({ example: 1, description: 'Number of orders that failed' })
  failedCount: number;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'IDs of successfully deposited orders',
  })
  successfulOrders: number[];

  @ApiProperty({
    example: [{ orderId: 6, reason: 'Order not found' }],
    description: 'Failed orders with reasons',
  })
  failedOrders: { orderId: number; reason: string }[];

  @ApiProperty({ example: 'Successfully deposited 5 orders, 1 failed' })
  message: string;
}
