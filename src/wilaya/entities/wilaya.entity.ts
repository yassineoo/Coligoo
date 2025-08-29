import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { City } from "./city.entity";

@Entity("wilaya")
export class Wilaya {
    @PrimaryColumn()
    code: string;

    @Column()
    name: string;

    @Column({charset: "utf8mb4"})
    ar_name: string;

    @OneToMany(() => City, city => city.wilaya)
    cities: City;
}