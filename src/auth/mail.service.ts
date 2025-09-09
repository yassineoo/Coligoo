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

  // Add these methods to your MailService class

  async sendPasswordResetLinkEmail(
    email: string,
    resetLink: string,
    userName: string,
  ) {
    const subject = 'Réinitialisation de votre mot de passe / Password Reset';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .content { margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background-color: #0056b3; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .arabic { direction: rtl; text-align: right; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 Password Reset</div>
            </div>
            
            <div class="content">
                <h2>Bonjour ${userName},</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong>
                    <ul>
                        <li>Ce lien expire dans 1 heure</li>
                        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                        <li>Ne partagez jamais ce lien avec qui que ce soit</li>
                    </ul>
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace;">
                    ${resetLink}
                </p>
            </div>
            
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            
            <div class="content arabic">
                <h2>مرحباً ${userName}،</h2>
                <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لتعيين كلمة مرور جديدة:</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ مهم:</strong>
                    <ul>
                        <li>هذا الرابط ينتهي خلال ساعة واحدة</li>
                        <li>إذا لم تطلب إعادة التعيين، تجاهل هذا البريد</li>
                        <li>لا تشارك هذا الرابط مع أي شخص</li>
                    </ul>
                </div>
                
                <p>إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace;">
                    ${resetLink}
                </p>
            </div>
            
            <div class="footer">
                <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
                <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.</p>
            </div>
        </div>
    </body>
    </html>
  `;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        html: htmlContent,
        from: `"Coligoo" <${process.env.EMAIL_USERNAME}>`,
      });
      console.log(`Password reset link sent to: ${email}`);
    } catch (error) {
      console.error('Error sending password reset link email:', error);
      throw new Error('Failed to send password reset link email');
    }
  }

  async sendPasswordResetConfirmationEmail(email: string, userName: string) {
    const subject =
      'Mot de passe modifié avec succès / Password Successfully Changed';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #28a745; }
            .content { margin-bottom: 30px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .arabic { direction: rtl; text-align: right; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">✅ Confirmation</div>
            </div>
            
            <div class="content">
                <h2>Bonjour ${userName},</h2>
                
                <div class="success">
                    <strong>✅ Votre mot de passe a été modifié avec succès !</strong>
                </div>
                
                <p>Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                
                <p><strong>Si vous n'avez pas effectué cette modification :</strong></p>
                <ul>
                    <li>Contactez immédiatement notre support</li>
                    <li>Vérifiez la sécurité de votre compte email</li>
                    <li>Changez votre mot de passe dès que possible</li>
                </ul>
            </div>
            
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            
            <div class="content arabic">
                <h2>مرحباً ${userName}،</h2>
                
                <div class="success">
                    <strong>✅ تم تغيير كلمة المرور بنجاح!</strong>
                </div>
                
                <p>تم إعادة تعيين كلمة المرور الخاصة بك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                
                <p><strong>إذا لم تقم بهذا التغيير:</strong></p>
                <ul>
                    <li>اتصل بالدعم فوراً</li>
                    <li>تحقق من أمان حساب البريد الإلكتروني</li>
                    <li>غير كلمة المرور في أسرع وقت ممكن</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Merci d'utiliser notre service / شكراً لاستخدام خدمتنا</p>
            </div>
        </div>
    </body>
    </html>
  `;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        html: htmlContent,
        from: `"Coligoo" <${process.env.EMAIL_USERNAME}>`,
      });
      console.log(`Password reset confirmation sent to: ${email}`);
    } catch (error) {
      console.error('Error sending password reset confirmation email:', error);
      throw new Error('Failed to send password reset confirmation email');
    }
  }
}
