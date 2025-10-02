import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';
// dto/bulk-delete-orders.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty } from 'class-validator';
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({ example: 'MySecondOrder' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
  @ApiPropertyOptional({ example: 'Updated order status' })
  @IsString()
  @IsOptional()
  status?: OrderStatus; // Optional field to update order status
  // add delivery men id
  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the deliveryman to assign',
  })
  @IsNumber()
  @IsOptional()
  deliverymanId?: number; // Optional field to assign a deliveryman
}

export class BulkDeleteOrdersDto {
  @ApiProperty({
    type: [Number],
    description: 'List of order IDs to delete',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  orderIds: number[];
}
