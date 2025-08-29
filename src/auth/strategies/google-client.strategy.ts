import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth2";
import { GoogleConfig } from "src/config/google.config";


@Injectable()
export class GoogleClientStrategy extends PassportStrategy(Strategy, 'google-client') {
    constructor(private readonly googleConfig: GoogleConfig) {
        super({
            clientID: googleConfig.getGoogleClientId(),
            clientSecret: googleConfig.getGoogleClientSecret(),
            callbackURL: googleConfig.getCallbackUrlClient(),
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
            prenom: name.givenName,
            nom: name.lastName,
            picture: photos[0].value,
        };
        done(null, user);
    }
}