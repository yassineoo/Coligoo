import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) {}

    getAppUrl(): string {
        return this.configService.get('APP_URL');
    }
}