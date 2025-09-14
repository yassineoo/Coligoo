import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { OtpService } from './otp.service';
import { GoogleClientStrategy } from './strategies/google-client.strategy';
import { EnvConfigModule } from 'src/config/config.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationModule } from 'src/notification/notification.module';
import { AppleStrategy } from './strategies/apple.strategy';

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
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'aissanyris84@gmail.com', // Gmail address
          pass: 'fluccvroupxcmrdv', // App password
        },
        tls: {
          rejectUnauthorized: false, // Important for VPS
        },
      },
      defaults: {
        from: `"Coligoo" <"aissanyris84">`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, OtpService, JwtStrategy, AppleStrategy],
})
export class AuthModule {}
