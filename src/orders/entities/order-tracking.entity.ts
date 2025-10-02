// entities/order-tracking.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order, OrderStatus } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order_tracking')
export class OrderTracking {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Related order' })
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @ApiProperty({ example: 1 })
  @Column()
  orderId: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.OUT_FOR_DELIVERY })
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ example: 'Alger' })
  @Column()
  location: string;

  @ApiProperty({ example: 'Package picked up from sender' })
  @Column({ type: 'text' })
  note: string;

  @ApiPropertyOptional({ example: 'https://example.com/proof.jpg' })
  @Column({ nullable: true })
  proofPhoto?: string;

  @ApiPropertyOptional({ example: 'https://example.com/signature.jpg' })
  @Column({ nullable: true })
  signature?: string;

  @ApiPropertyOptional({ description: 'User who made this update' })
  @ManyToOne(() => User, { nullable: true })
  updatedBy?: User;

  @ApiProperty({ example: '2025-08-17T10:30:00Z' })
  @CreateDateColumn()
  timestamp: Date;
}
