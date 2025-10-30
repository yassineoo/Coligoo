import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EnvConfigModule } from 'src/config/config.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationModule } from 'src/notification/notification.module';
import { AppleStrategy } from './strategies/apple.strategy';
import { SmsService } from './sms.service';
import { OtpService } from './otp.service';

@Module({
  imports: [
    UsersModule,
    EnvConfigModule,
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES,
      },
    }),
    /*  MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true' ? true : false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    */
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'aissanyris84@gmail.com',
            pass: 'fluccvroupxcmrdv',
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 75000,
          pool: true,
          maxConnections: 1,
          rateDelta: 1000,
          rateLimit: 5,
          // Add debug for troubleshooting
          debug: process.env.NODE_ENV === 'development',
          logger: process.env.NODE_ENV === 'development',
        },
        defaults: {
          from: '"Coligoo" <aissanyris84@gmail.com>',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    OtpService,
    JwtStrategy,
    AppleStrategy,
    SmsService,
  ],
})
export class AuthModule {}
