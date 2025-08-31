import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from 'src/orders/entities/order-items';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

export enum Category {
  ELECTRONICS = 'Electronics',
  CLOTHING = 'Clothing',
  HOME_GARDEN = 'Home & Garden',
  SPORTS_OUTDOORS = 'Sports & Outdoors',
  BOOKS = 'Books',
  TOYS_GAMES = 'Toys & Games',
  HEALTH_BEAUTY = 'Health & Beauty',
  AUTOMOTIVE = 'Automotive',
  JEWELRY = 'Jewelry',
  FOOD_BEVERAGES = 'Food & Beverages',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_name', nullable: true })
  productName: string;

  @Column({ name: 'product_alias', nullable: true })
  productAlias: string;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.ELECTRONICS,
    nullable: true,
  })
  category: Category;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column('int', { nullable: true })
  quantity: number;

  @Column({ name: 'has_variables', default: false, nullable: true })
  hasVariables: boolean;

  @Column('json', { nullable: true })
  variables: any;

  @Column({ name: 'show_alias_in_order', default: false, nullable: true })
  showAliasInOrder: boolean;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;


    // NEW: Add relationship to OrderItem
  @ApiProperty({ 
    description: 'Order items that include this product',
    type: () => [OrderItem]
  })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
}
