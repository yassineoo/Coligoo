import { Injectable } from "@nestjs/common";
import { OtpType } from "./types/otp-type.enum";
import { DataSource } from "typeorm";
import { Otp } from "./entities/otp.entity";


@Injectable()
export class OtpService {
    constructor(
        private readonly dataSource: DataSource
    ) {}

    async createOtp(email: string, type: OtpType) {
        const code = Math.floor(100000 + Math.random() * 900000);
        const otpRepository = this.dataSource.getRepository(Otp);
        const emailOtp = await otpRepository.findOneBy({ email, type });
        if (emailOtp) {
            await otpRepository.update(emailOtp.email, {
                otp: code.toString(),
                expiresAt: new Date(Date.now() + 1000 * 60 * 10)
            })
        } else {
            await otpRepository.save({
            otp: code.toString(),
            email,
            type,
            expiresAt: new Date(Date.now() + 1000 * 60 * 10),
            });
        }
        return code;
    }

    async verifyOtp (email: string, otp: string, type: OtpType) {
        const otpRepository = this.dataSource.getRepository(Otp);
        const emailOtp = await otpRepository.findOneBy({ email, type });
        if (!emailOtp) {
            return false;
        }
        if (emailOtp.otp !== otp) {
            return false;
        }
        if (emailOtp.expiresAt < new Date()) {
            return false;
        }
        return true;
    }
}