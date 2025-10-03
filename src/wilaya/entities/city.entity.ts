import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Wilaya } from './wilaya.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('city')
export class City {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ouled Fayet' })
  @Column()
  name: string;

  @ApiProperty({ example: 'ولد فايت' })
  @Column({ charset: 'utf8mb4' })
  ar_name: string;

  @ApiProperty({ description: 'Parent wilaya', type: () => Wilaya })
  @ManyToOne(() => Wilaya, (wilaya) => wilaya.cities)
  @JoinColumn({ name: 'wilayaCode' })
  wilaya: Wilaya;

  // FIXED: Remove duplicate @ApiProperty and use lazy type function
  @ApiProperty({
    description: 'Orders originating from this city',
    type: () => [Order], // Lazy function prevents circular dependency
  })
  @OneToMany(() => Order, (order) => order.fromCity)
  ordersFrom: Order[];

  @ApiProperty({
    description: 'Orders being delivered to this city',
    type: () => [Order], // Lazy function
  })
  @OneToMany(() => Order, (order) => order.toCity)
  ordersTo: Order[];

  @ApiProperty({
    description: 'Users registered in this city',
    type: () => [User], // Lazy function
  })
  @OneToMany(() => User, (user) => user.city)
  users: User[];
}
