import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OtpType } from './types/otp-type.enum';
import { ContactFormDto } from './dto/email.dto';

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

  async sendContactFormEmail(contactFormDto: ContactFormDto) {
    try {
      const { email, fullName, subject, message } = contactFormDto;

      // Email template for contact form
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Nouveau message de contact - Coligoo
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Informations du contact:</h3>
            <p><strong>Nom complet:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Sujet:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #555;">${message}</p>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Ce message a été envoyé depuis le formulaire de contact de Coligoo.
              <br>
              Répondez directement à cet email pour contacter ${fullName}.
            </p>
          </div>
        </div>
      `;

      // Send email to admin/support team
      await this.mailerService.sendMail({
        to: process.env.CONTACT_EMAIL || process.env.EMAIL_USERNAME,
        subject: `Contact: ${subject} - ${fullName}`,
        html: htmlTemplate,
        replyTo: email,
        from: `"Coligoo Contact Form" <${process.env.EMAIL_USERNAME}>`,
      });

      // Send confirmation email to the person who submitted the form
      await this.sendContactFormConfirmation(email, fullName, subject);
    } catch (error) {
      console.error('Error sending contact form email:', error);
      throw error;
    }
  }

  private async sendContactFormConfirmation(
    email: string,
    fullName: string,
    subject: string,
  ) {
    try {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff; text-align: center;">Coligoo</h2>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h3 style="color: #28a745; margin-top: 0;">
              ✓ Message reçu avec succès!
            </h3>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Bonjour <strong>${fullName}</strong>,
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Nous avons bien reçu votre message concernant: <strong>"${subject}"</strong>
              <br>
              Notre équipe examinera votre demande et vous répondra dans les plus brefs délais.
            </p>
            
            <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Temps de réponse estimé:</strong> 24-48 heures
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Cet email de confirmation a été envoyé automatiquement.</p>
            <p>© 2025 Coligoo. Tous droits réservés.</p>
          </div>
        </div>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: `Confirmation: ${subject}`,
        html: confirmationHtml,
        from: `"Coligoo" <${process.env.EMAIL_USERNAME}>`,
      });
    } catch (error) {
      console.error('Error sending contact form confirmation:', error);
    }
  }
}
