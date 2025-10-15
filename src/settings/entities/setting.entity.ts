// src/settings/entities/setting.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('settings')
export class Setting {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  // ===========================
  // WEIGHT SETTINGS
  // ===========================

  @ApiProperty({
    example: 10,
    description: 'Free weight limit in KG (no extra charge below this)',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 10 })
  freeWeightLimit: number;

  @ApiProperty({
    example: 50,
    description: 'Price per KG when weight exceeds free limit',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 50 })
  weightPricePerKg: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum allowed weight in KG',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 100 })
  maxWeightLimit: number;

  // ===========================
  // VOLUME SETTINGS
  // ===========================

  @ApiProperty({
    example: 50000,
    description: 'Free volume limit in cm³ (no extra charge below this)',
  })
  @Column('decimal', { precision: 15, scale: 2, default: 50000 })
  freeVolumeLimit: number;

  @ApiProperty({
    example: 0.001,
    description: 'Price per cm³ when volume exceeds free limit',
  })
  @Column('decimal', { precision: 10, scale: 5, default: 0.001 })
  volumePricePerCm3: number;

  @ApiProperty({
    example: 500000,
    description: 'Maximum allowed volume in cm³',
  })
  @Column('decimal', { precision: 15, scale: 2, default: 500000 })
  maxVolumeLimit: number;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T12:30:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
