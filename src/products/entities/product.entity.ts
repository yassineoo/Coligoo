import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

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
  FOOD_BEVERAGES = 'Food & Beverages'
}




@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_alias' })
  productAlias: string;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.ELECTRONICS
  })
  category: Category;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  quantity: number;

  @Column({ name: 'has_variables', default: false })
  hasVariables: boolean;

  @Column('json', { nullable: true })
  variables: any;

  @Column({ name: 'show_alias_in_order', default: false })
  showAliasInOrder: boolean;

  @Column({ name: 'vendor_id' })
  vendorId: number;

  // Uncomment this if you have User entity
  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}