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
  // Vendor only - Preparing the order
  IN_PREPARATION = 'in_preparation',

  // Vendor ready to ship - Hub and Admin can now see it
  //  READY_TO_SHIP = 'pret_a_expedier',

  CONFIRMED = 'confirmed',

  DEPOSITED_AT_HUB = 'deposited_at_hub',

  CANCELLED = 'cancelled',

  // In transit between hubs
  DISPATCHED = 'dispatched',

  // Arrived at destination hub
  COLLECTED = 'collected',

  // Deliveryman has the package
  OUT_FOR_DELIVERY = 'out_for_delivery',

  // Successfully delivered to client
  DELIVERED = 'delivered',

  // Return flow
  RETURNED = 'returned',
  RETURNED_TO_HUB = 'returned_to_hub',

  // Payment status
  PAID = 'paid',
}

export enum ReturnCause {
  FAILED_ATTEMPT_1 = 'failed_attempt_1',
  FAILED_ATTEMPT_2 = 'failed_attempt_2',
  FAILED_ATTEMPT_3 = 'failed_attempt_3',
  FAILED_ATTEMPT_4 = 'failed_attempt_4',
  SCHEDULED = 'scheduled',
  NO_RESPONSE = 'no_response',
  WRONG_NUMBER = 'wrong_number',
  CLIENT_REFUSED = 'client_refused',
  ADDRESS_NOT_FOUND = 'address_not_found',
  CLIENT_NOT_AVAILABLE = 'client_not_available',
  OTHER = 'other',
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
  @Column({ nullable: true })
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

  @ApiProperty({
    example: [
      { name: 'كتب الطبخ', quantity: 2 },
      { name: 'مجلة الديكور', quantity: 1 },
    ],
    description: 'Products list for unregistered items',
  })
  @Column({ type: 'json', nullable: true })
  productList: { name: string; quantity: number }[] | null;

  @ApiProperty({ example: 2400 })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount amount' })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

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

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PREPARATION })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.IN_PREPARATION,
  })
  status: OrderStatus;

  @ApiPropertyOptional({
    enum: ReturnCause,
    example: ReturnCause.NO_RESPONSE,
    description: 'Reason for return if status is RETURNED',
  })
  @Column({
    type: 'enum',
    enum: ReturnCause,
    nullable: true,
  })
  returnCause: ReturnCause;

  @ApiPropertyOptional({
    example: 'Client was not home during delivery attempts',
    description: 'Additional notes about the return',
  })
  @Column({ type: 'text', nullable: true })
  returnNotes: string;

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

  @ApiPropertyOptional({
    example: '2025-08-18T14:00:00Z',
    description: 'When vendor shipped the order to hub',
  })
  @Column({ nullable: true })
  shippedAt: Date;

  @ApiPropertyOptional({
    example: '2025-08-19T11:00:00Z',
    description: 'When order was returned',
  })
  @Column({ nullable: true })
  returnedAt: Date;

  @ApiPropertyOptional({
    example: '2025-08-20T09:00:00Z',
    description: 'When payment was made to vendor',
  })
  @Column({ nullable: true })
  paidAt: Date;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of delivery attempts made',
  })
  @Column({ default: 0 })
  deliveryAttempts: number;

  // NEW: Replace productList with orderItems relationship
  @ApiProperty({
    description: 'Products in this order',
    type: () => [OrderItem],
  })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  orderItems: OrderItem[];

  // Computed properties
  get totalProductsPrice(): number {
    return (
      this.orderItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0
    );
  }

  get totalOrderPrice(): number {
    return this.totalProductsPrice + Number(this.shippingFee || 0);
  }

  get totalItems(): number {
    return this.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  // Helper method to check if order is visible to hub/admin
  get isVisibleToHub(): boolean {
    return this.status !== OrderStatus.IN_PREPARATION;
  }

  // Helper method to check if barcode can be printed
  get canPrintBarcode(): boolean {
    return [OrderStatus.IN_PREPARATION, OrderStatus.CONFIRMED].includes(
      this.status,
    );
  }
}
