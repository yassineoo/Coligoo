import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth2";
import { GoogleConfig } from "src/config/google.config";


@Injectable()
export class GoogleArtisanStrategy extends PassportStrategy(Strategy, 'google-artisan') {
    constructor(private readonly googleConfig: GoogleConfig) {
        super({
            clientID: googleConfig.getGoogleClientId(),
            clientSecret: googleConfig.getGoogleClientSecret(),
            callbackURL: googleConfig.getCallbackUrlArtisan(),
            scope: ['profile', 'email']
        })
    }
    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;

        const user = {
            provider: 'google',
            providerId: id,
            email: emails[0].value,
            name: `${name.givenName} ${name.lastName}`,
            picture: photos[0].value,
        };
        done(null, user);
    }
}