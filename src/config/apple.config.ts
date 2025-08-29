import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleConfig {
    constructor(private readonly configService: ConfigService) {}

    getAppleClientId(): string {
        return this.configService.get<string>('APPLE_CLIENT_ID');
    }

    getAppleTeamId(): string {
        return this.configService.get<string>('APPLE_TEAM_ID');
    }
    
    getAppleKeyId(): string {
        return this.configService.get<string>('APPLE_KEY_ID');
    }

    getAppleCallbackUrl(): string {
        return this.configService.get<string>('APPLE_CALLBACK_URL');
    }

    getAppleKeyfilePath(): string {
        return this.configService.get<string>('APPLE_KEY_FILE_PATH');
    }
}