import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { City } from './city.entity';
import { ShippingFee } from 'src/shipping/entities/shipping.entity';

@Entity('wilaya')
export class Wilaya {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column({ charset: 'utf8mb4' })
  ar_name: string;

  @OneToMany(() => City, (city) => city.wilaya)
  cities: City;

  @OneToMany(() => ShippingFee, (fee) => fee.fromWilaya)
  shippingFeesFrom: ShippingFee[];

  @OneToMany(() => ShippingFee, (fee) => fee.toWilaya)
  shippingFeesTo: ShippingFee[];
}
