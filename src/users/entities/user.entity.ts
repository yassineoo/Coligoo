// user/entities/user.entity.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/types/roles.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { Hub } from 'src/hub/entities/hub.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ nullable: true })
  nom: string;

  @Column({ nullable: true })
  prenom: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  // Permissions array
  @Column('simple-array', { nullable: true })
  permissions: string[];

  // Hub relationship (for HUB_EMPLOYEE only)
  @ManyToOne(() => Hub, (hub) => hub.employees, { nullable: true })
  @JoinColumn({ name: 'hubAdminId' })
  hub: Hub;

  @Column({ name: 'hubAdminId', nullable: true })
  hubAdminId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  imgUrl: string;

  @Column({ default: false })
  blocked: boolean;

  @Column({ nullable: true })
  deviceToken: string;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  // User's city (for delivery men, vendors, etc.)
  @ApiPropertyOptional({
    description: "User's city/location",
    type: () => City,
  })
  @ManyToOne(() => City, (city) => city.users, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ type: 'int', nullable: true, default: 556 })
  cityId: number;
}
