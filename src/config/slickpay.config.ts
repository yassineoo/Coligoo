import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlickpayConfig {
    constructor(private readonly configService: ConfigService) {}

    getPublicKey(): string {
        return this.configService.get('SLICKPAY_PUBLIC_KEY');
    }
}