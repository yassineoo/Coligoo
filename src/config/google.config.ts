import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleConfig {
    constructor(private readonly configService: ConfigService) {}

    getGoogleServiceEmail() {
        return this.configService.get('GOOGLE_SERVICE_EMAIL')
    }
    getGooglePrivateKey() {
        return this.configService.get('GOOGLE_PRIVATE_KEY')
    }
    getGoogleSpreadsheetId() {
        return this.configService.get('GOOGLE_SPREADSHEET_ID')
    }
    getGoogleClientId() {
        return this.configService.get('GOOGLE_CLIENT_ID')
    }
    getGoogleClientSecret() {
        return this.configService.get('GOOGLE_CLIENT_SECRET')
    }
    getCallbackUrlClient() {
        return this.configService.get('GOOGLE_CALLBACK_URL_CLIENT')
    }
    getCallbackUrlArtisan() {
        return this.configService.get('GOOGLE_CALLBACK_URL_ARTISAN')
    }
}
