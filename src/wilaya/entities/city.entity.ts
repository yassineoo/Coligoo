import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wilaya } from './wilaya.entity';

@Entity('city')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ charset: 'utf8mb4' })
  ar_name: string;

  @ManyToOne(() => Wilaya, (wilaya) => wilaya.cities)
  @JoinColumn({ name: 'wilayaCode' })
  wilaya: Wilaya;
}
