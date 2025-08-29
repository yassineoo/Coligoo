import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
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
