// src/shipping/entities/shipping-zone.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingFee } from './shipping.entity';
import { City } from 'src/wilaya/entities/city.entity';

@Entity('shipping_zones')
export class ShippingZone {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Zone 1 - Centre Blida' })
  @Column()
  name: string;

  @ApiProperty({
    example: 600,
    description: 'Home delivery price for this zone',
  })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Parent shipping fee route',
    type: () => ShippingFee,
  })
  @ManyToOne(() => ShippingFee, (fee) => fee.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shippingFeeId' })
  shippingFee: ShippingFee;

  @ApiProperty({ example: 1 })
  @Column()
  shippingFeeId: number;

  @ApiProperty({
    description: 'Communes/Cities in this zone',
    type: () => [City],
  })
  @ManyToMany(() => City, { eager: true })
  @JoinTable({
    name: 'shipping_zone_cities',
    joinColumn: { name: 'zoneId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cityId', referencedColumnName: 'id' },
  })
  cities: City[];

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
