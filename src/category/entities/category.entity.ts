import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ charset: 'utf8mb4' })
  ar_name: string;

  @Column()
  iconUrl: string;

  @Column()
  fileName: string;

  @Column()
  color: string;

  @Column({ default: 0 })
  nbrSubCategories: number;
}
