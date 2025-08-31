import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { City } from 'src/wilaya/entities/city.entity';
import { User } from 'src/users/entities/user.entity';
import { OrderItem } from './order-items';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentType {
  COD = 'cash_on_delivery',
  PREPAID = 'prepaid',
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'MySecondOrder' })
  @Column({ unique: true })
  orderId: string;

  @ApiProperty({ description: 'Vendor / Client who created the order' })
  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ApiPropertyOptional({ description: 'Assigned deliveryman' })
  @ManyToOne(() => User, { nullable: true, eager: true })
  deliveryman: User;

  @ApiProperty({ example: 'رفيدة' })
  @Column()
  firstname: string;

  @ApiProperty({ example: 'بن مهيدي' })
  @Column()
  lastName: string;

  @ApiProperty({ example: '0123456789' })
  @Column()
  contactPhone: string;

  @ApiProperty({ example: '0123456789' })
  @Column({nullable:true})
  contactPhone2: string;

  @ApiProperty({ example: 'حي الياسمين' })
  @Column()
  address: string;

  @ApiProperty({ description: 'Sender city (wilaya)', example: 'Batna' })
  @ManyToOne(() => City, { eager: true })
  fromCity: City;

  @ApiProperty({
    description: 'Receiver city (commune/wilaya)',
    example: 'Ouled Fayet - Alger',
  })
  @ManyToOne(() => City, { eager: true })
  toCity: City;

  @ApiProperty({ example: 'he can open it first ' })
  @Column()
  note: string;



  @ApiProperty({ example: 'كتب الطبخ' })
  @Column({ type: 'text' })
  productList: string;

  @ApiProperty({ example: 2400 })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiPropertyOptional({ example: 300 })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @ApiPropertyOptional({ example: 6 })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight: number;

  @ApiPropertyOptional({ example: 10 })
  @Column({ nullable: true })
  height: number;
  

  @ApiPropertyOptional({ example: 20 })
  @Column({ nullable: true })
  width: number;

  @ApiPropertyOptional({ example: 30 })
  @Column({ nullable: true })
  length: number;

  @ApiProperty({
    example: false,
    description: 'true = pickup from hub, false = home delivery',
  })
  @Column({ default: false })
  isStopDesk: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  freeShipping: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  hasExchange: boolean;

  @ApiProperty({ enum: PaymentType, example: PaymentType.COD })
  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.COD })
  paymentType: PaymentType;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: '2025-08-16T12:34:56Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-08-16T12:34:56Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2025-08-17T10:00:00Z' })
  @Column({ nullable: true })
  deliveredAt: Date;

  @ApiPropertyOptional({ example: '2025-08-17T08:00:00Z' })
  @Column({ nullable: true })
  cancelledAt: Date;




    // NEW: Replace productList with orderItems relationship
  @ApiProperty({ 
    description: 'Products in this order',
    type: () => [OrderItem] 
  })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { 
    cascade: true,
    eager: true 
  })
  orderItems: OrderItem[];

  
  // Computed properties
  get totalProductsPrice(): number {
    return this.orderItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  }

  get totalOrderPrice(): number {
    return this.totalProductsPrice + Number(this.shippingFee || 0);
  }

  get totalItems(): number {
    return this.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }
}
