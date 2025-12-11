// order-tracking/entities/order-tracking.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Hub } from 'src/hub/entities/hub.entity';
import { PickupPoint } from 'src/pickup-point/entities/pickup-point.entity';

export enum LocationType {
  VENDOR = 'vendor',
  DELIVERYMAN = 'deliveryman',
  HUB = 'hub',
  PICKUP_POINT = 'pickup_point',
  LOCKER = 'locker',
  CUSTOMER = 'customer',
}

export enum TrackingAction {
  CREATED = 'created',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  SHIPPED = 'shipped',
  ARRIVED = 'arrived',
  DEPARTED = 'departed',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERY_ATTEMPTED = 'delivery_attempted',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
  TRANSFERRED = 'transferred',
  ON_HOLD = 'on_hold',
  PAID = 'paid',
}

@Entity('order_tracking')
@Index(['orderId', 'timestamp'])
@Index(['locationType', 'hubId'])
@Index(['locationType', 'pickupPointId'])
export class OrderTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.trackingHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  @Index()
  orderId: number;

  @Column({ type: 'enum', enum: TrackingAction })
  action: TrackingAction;

  @Column({ type: 'enum', enum: LocationType })
  locationType: LocationType;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @ManyToOne(() => Hub, { nullable: true, eager: true })
  @JoinColumn({ name: 'hub_id' })
  hub: Hub;

  @Column({ name: 'hub_id', nullable: true })
  hubId: number;

  @ManyToOne(() => PickupPoint, { nullable: true, eager: true })
  @JoinColumn({ name: 'pickup_point_id' })
  pickupPoint: PickupPoint;

  @Column({ name: 'pickup_point_id', nullable: true })
  pickupPointId: number;

  @Column({ name: 'locker_id', nullable: true })
  lockerId: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;

  @Column({ name: 'performed_by', nullable: true })
  performedById: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  customerMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
}
