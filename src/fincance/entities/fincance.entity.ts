// src/finance/entities/withdrawal-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WithdrawalCondition {
  WAITING = 'waiting',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
}

@Entity('withdrawal_requests')
export class WithdrawalRequest {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'ZRKGH321A', description: 'Unique tracking code' })
  @Column({ unique: true })
  trackingCode: string;

  @ApiProperty({ description: 'Vendor who requested withdrawal' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: User;

  @Column()
  vendorId: number;

  @ApiProperty({
    example: 20000,
    description: 'Total amount to be paid to vendor',
  })
  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @ApiProperty({
    example: 15000,
    description: 'Total from delivered/paid orders',
  })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidOrdersAmount: number;

  @ApiProperty({
    example: 5000,
    description: 'Total deduction from returned orders',
  })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  returnedOrdersAmount: number;

  @ApiProperty({ example: 43, description: 'Number of orders in this request' })
  @Column({ default: 0 })
  orderCount: number;

  @ApiProperty({ example: 35, description: 'Number of paid orders' })
  @Column({ default: 0 })
  paidOrderCount: number;

  @ApiProperty({ example: 8, description: 'Number of returned orders' })
  @Column({ default: 0 })
  returnedOrderCount: number;

  @ApiProperty({
    enum: WithdrawalStatus,
    example: WithdrawalStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @ApiProperty({
    enum: WithdrawalCondition,
    example: WithdrawalCondition.WAITING,
  })
  @Column({
    type: 'enum',
    enum: WithdrawalCondition,
    default: WithdrawalCondition.WAITING,
  })
  condition: WithdrawalCondition;

  @ApiProperty({
    description: 'Orders linked to this withdrawal request',
    type: () => [Order],
  })
  @OneToMany(() => Order, (order) => order.withdrawalRequest)
  orders: Order[];

  @ApiProperty({
    example: '2025-08-29T10:00:00Z',
    description: 'When payment was completed',
  })
  @Column({ nullable: true })
  paymentDate: Date;

  @ApiProperty({ example: 'Bank transfer completed' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: '2025-08-29T08:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-08-29T14:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
