import { Module } from '@nestjs/common';
import { GoogleConfig } from './google.config';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './database.config';
import { AppConfig } from './app.config';
import { JwtConfig } from './jwt.config';
import { SlickpayConfig } from './slickpay.config';
import { AppleConfig } from './apple.config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  })],
  providers: [GoogleConfig, DatabaseConfig, AppConfig, JwtConfig, SlickpayConfig, AppleConfig],
  exports: [GoogleConfig, DatabaseConfig, AppConfig, JwtConfig, SlickpayConfig, AppleConfig],
})
export class EnvConfigModule {}