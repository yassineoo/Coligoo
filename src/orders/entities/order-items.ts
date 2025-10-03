import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Product } from 'src/products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  // CRITICAL FIX: Hide this from Swagger to break the circular dependency
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ example: 1, description: 'Order ID' })
  @Column()
  orderId: number;

  @ApiProperty({ description: 'Reference to the product' })
  @ManyToOne(() => Product, (product) => product.orderItems, {
    eager: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity of this product in the order',
  })
  @Column('int', { default: 1 })
  quantity: number;

  @ApiProperty({
    example: 1200.5,
    description:
      'Price of the product at the time of order (for historical tracking)',
  })
  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'Size: L, Color: Red',
    description: 'Product variations/options selected for this order item',
  })
  @Column('text', { nullable: true })
  productVariations: string;

  @ApiPropertyOptional({
    example: 'Handle with care',
    description: 'Special notes for this specific product',
  })
  @Column('text', { nullable: true })
  notes: string;

  @ApiProperty({ example: '2025-08-16T12:34:56Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-16T12:34:56Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed property for total price of this item
  get totalPrice(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}
