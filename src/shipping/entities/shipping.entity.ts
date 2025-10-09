// ===========================
// 1. ENTITY - FROM/TO WILAYASs
// ===========================

// src/shipping/entities/shipping-fee.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';
import { ShippingZone } from './shipping-zone.entity';

@Entity('shipping_fees')
export class ShippingFee {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Origin wilaya', type: () => Wilaya })
  @ManyToOne(() => Wilaya, { eager: true })
  @JoinColumn({ name: 'fromWilayaCode' })
  fromWilaya: Wilaya;

  @ApiProperty({ example: '16' })
  @Column()
  fromWilayaCode: string;

  @ApiProperty({ description: 'Destination wilaya', type: () => Wilaya })
  @ManyToOne(() => Wilaya, { eager: true })
  @JoinColumn({ name: 'toWilayaCode' })
  toWilaya: Wilaya;

  @ApiProperty({ example: '31' })
  @Column()
  toWilayaCode: string;

  @ApiProperty({
    example: 400,
    description: 'Desktop/Stop desk delivery price',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 500 })
  desktopPrice: number;

  @ApiProperty({ example: 600, description: 'Home delivery price' })
  @Column('decimal', { precision: 10, scale: 2, default: 600 })
  homePrice: number;

  @ApiProperty({ example: 500, description: 'Return shipping price' })
  @Column('decimal', { precision: 10, scale: 2, default: 300 })
  returnPrice: number;

  @ApiProperty({
    description: 'Delivery zones for this route',
    type: () => [ShippingZone],
  })
  @OneToMany(() => ShippingZone, (zone) => zone.shippingFee)
  zones: ShippingZone[];

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
