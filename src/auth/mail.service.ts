import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OtpType } from './types/otp-type.enum';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendVerficationCodeEmail(
    email: string,
    code: string,
    otpType: OtpType,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Coligoo ${
          otpType === OtpType.VERIFY_EMAIL
            ? 'Email Verification'
            : 'Password Reset'
        } `,
        html: `<h1>Voici votre code de ${
          otpType === OtpType.VERIFY_EMAIL
            ? "verification d'email"
            : 'réinitialisation de mot de passe'
        }</h1><h3>${code}</h3>`,
        from: `"Coligoo" <${process.env.EMAIL_USERNAME}>`,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
