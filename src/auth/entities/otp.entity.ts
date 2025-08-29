import { Column, CreateDateColumn, Entity } from "typeorm";

@Entity("otp")
export class Otp {
    @Column()
    otp: string;

    @Column({ primary: true})
    email: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({enum: ['reset-password', 'verify-email'], type: 'enum'})
    type: string;

    @Column()
    expiresAt: Date;
}