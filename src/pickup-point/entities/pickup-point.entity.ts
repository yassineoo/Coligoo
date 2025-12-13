// pickup-point/entities/pickup-point.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from 'src/wilaya/entities/city.entity';
import { User } from 'src/users/entities/user.entity';
import { Hub } from 'src/hub/entities/hub.entity';

@Entity('pickup_point')
export class PickupPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // ✅ Pickup Point admin (responsable)
  @OneToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'admin_user_id' })
  admin: User;

  @Column({ name: 'admin_user_id' })
  adminUserId: number;

  // ✅ Localisation
  @ManyToOne(() => City, { nullable: true, eager: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'city_id', nullable: true })
  cityId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
