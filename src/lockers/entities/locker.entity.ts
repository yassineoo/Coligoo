// src/lockers/entities/locker.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { City } from 'src/wilaya/entities/city.entity';

export enum ClosetStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

export interface Closet {
  id: number;
  status: ClosetStatus;
  currentOrderId: number | null;
}

export interface OperatingHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

@Entity('lockers')
export class Locker {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'LOCK-16-1',
    description: 'Reference ID format: LOCK-{wilayaCode}-{lockerId}',
  })
  @Column({ unique: true })
  referenceId: string;

  @ApiProperty({ example: 'Downtown Locker Station' })
  @Column()
  name: string;

  @ApiProperty({ example: 'حي السلام، شارع الاستقلال' })
  @Column()
  address: string;

  @ApiProperty({
    description: 'City where locker is located',
    type: () => City,
  })
  @ManyToOne(() => City, { eager: true, nullable: false })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column()
  cityId: number;

  @ApiProperty({ example: 20, description: 'Total number of closets' })
  @Column()
  capacity: number;

  @ApiProperty({
    example: [
      { id: 1, status: 'available', currentOrderId: null },
      { id: 2, status: 'occupied', currentOrderId: 123 },
    ],
    description: 'Array of closets with their status',
  })
  @Column({ type: 'json' })
  closets: Closet[];

  @ApiProperty({
    example: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' },
    },
    description: 'Operating hours for each day of the week',
  })
  @Column({ type: 'json' })
  operatingHours: OperatingHours;

  @ApiProperty({ example: true, description: 'Whether locker is active' })
  @Column({ default: true })
  isActive: boolean;
  /*
  @ApiProperty({ example: '0123456789', description: 'Support contact phone' })
  @Column({ nullable: true })
  contactPhone: string;

  */

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T12:30:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property: available closets count
  get availableClosets(): number {
    return this.closets.filter((c) => c.status === ClosetStatus.AVAILABLE)
      .length;
  }

  // Computed property: occupied closets count
  get occupiedClosets(): number {
    return this.closets.filter((c) => c.status === ClosetStatus.OCCUPIED)
      .length;
  }

  // Computed property: is locker full
  get isFull(): boolean {
    return this.availableClosets === 0;
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateClosets() {
    if (this.closets.length !== this.capacity) {
      throw new Error('Number of closets must match capacity');
    }
  }
}
