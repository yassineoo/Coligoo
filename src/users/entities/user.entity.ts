import { UserRole } from 'src/common/types/roles.enum';
import { Notification } from 'src/notification/entities/notification.entity';
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



   // 👇 permissions array of strings
  @Column('simple-array', { nullable: true })
  permissions: string[];

  // 👇 Hub relationship - HUB_EMPLOYEE belongs to HUB_ADMIN
  @Column({ name: 'hub_id', nullable: true })
  hubId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'hub_id' })
  hubAdmin: User;

  // 👇 HUB_ADMIN can have many HUB_EMPLOYEE
  @OneToMany(() => User, (user) => user.hubAdmin)
  hubEmployees: User[];
  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  dob: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: ['homme', 'femme'], nullable: true })
  sex: string;

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
}
