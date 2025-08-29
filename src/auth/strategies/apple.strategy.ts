import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@arendajaelu/nestjs-passport-apple';
import { AppleConfig } from 'src/config/apple.config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly appleConfig: AppleConfig) {
    super({
      clientID: appleConfig.getAppleClientId(),
      teamID: appleConfig.getAppleTeamId(),
      keyID: appleConfig.getAppleKeyId(),
      keyFilePath: appleConfig.getAppleKeyfilePath(),
      callbackURL: appleConfig.getAppleCallbackUrl(),
      passReqToCallback: false,
      scope: ['email', 'name'],
    });
  }
}