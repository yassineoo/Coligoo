// hub/entities/hub.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { City } from 'src/wilaya/entities/city.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('hub')
export class Hub {
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

  // Hub admin (owner)
  @OneToOne(() => User, (user) => user.hubAdminId, { nullable: false })
  @JoinColumn({ name: 'admin_user_id' })
  admin: User;

  @Column({ name: 'admin_user_id' })
  adminUserId: number;

  // Hub employees
  @OneToMany(() => User, (user) => user.hub)
  employees: User[];

  // Hub location
  @ManyToOne(() => City, { nullable: true, eager: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'city_id', nullable: true })
  cityId: number;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
