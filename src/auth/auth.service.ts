import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OtpType } from './types/otp-type.enum';
import { MailService } from './mail.service';
import { LoginDto } from './dto/login.dto';
import { Hash } from 'src/users/utils/hash';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  changePhoneDto,
  ResetPasswordDto,
  ResetPasswordWithTokenDto,
  SendResetLinkDto,
  VerifyResetTokenDto,
} from './dto/reset-password.dto';
import { ClientRegisterDto } from './dto/client-register.dto';

import { Request } from 'express';
import { AdminNotificationService } from 'src/notification/admin-notification.service';
import { UserRole } from 'src/common/types/roles.enum';
import { RegisterDto } from './dto/register.dto';
import { ContactFormDto } from './dto/email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  async registerClient(registerDto: ClientRegisterDto) {
    const user = await this.usersService.createClient({
      ...registerDto,
      role: UserRole.DELIVERYMAN,
    });

    const code = await this.otpService.createOtp(
      user.email,
      OtpType.VERIFY_EMAIL,
    );

    this.mailService.sendVerficationCodeEmail(
      user.email,
      code.toString(),
      OtpType.VERIFY_EMAIL,
    );

    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });

    // Get unified user info
    const userInfo = await this.usersService.getUserInfo(user.id);

    return {
      message: 'Inscription réussie',
      token,
      userInfo,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email, true);

    if (!user || !user.password) {
      throw new BadRequestException({
        fr: 'Email ou mot de passe incorrect',
        ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        en: 'Email or password is incorrect',
      });
    }

    const isPasswordValid = await Hash.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException({
        fr: 'Email ou mot de passe incorrect',
        ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        en: 'Email or password is incorrect',
      });
    }

    if (user.blocked) {
      throw new BadRequestException({
        fr: 'Votre compte a été bloqué !',
        ar: 'تم حظر حسابك',
        en: 'Your account has been blocked!',
      });
    }

    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });

    if (loginDto.deviceToken) {
      await this.usersService.update(user.id, {
        deviceToken: loginDto.deviceToken,
      });
    }

    // Get unified user info after potential device token update
    const userInfo = await this.usersService.getUserInfo(user.id);

    return {
      message: 'Connexion réussie',
      token,
      userInfo,
    };
  }

  async registerVendor(registerDto: RegisterDto) {
    const user = await this.usersService.createClient({
      ...registerDto,
      role: UserRole.VENDOR,
    });

    const code = await this.otpService.createOtp(
      user.email,
      OtpType.VERIFY_EMAIL,
    );

    this.mailService.sendVerficationCodeEmail(
      user.email,
      code.toString(),
      OtpType.VERIFY_EMAIL,
    );

    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });

    // Get unified user info
    const userInfo = await this.usersService.getUserInfo(user.id);

    return {
      message: 'Inscription réussie',
      token,
      userInfo,
    };
  }

  async changePhone(dto: changePhoneDto, userId: number) {
    const { phone, firebaseUserId } = dto;

    // Check if the new phone number already exists
    const existingUser = await this.usersService.findUserByPhone(phone, true);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException({
        fr: 'Ce numéro de téléphone est déjà utilisé',
        ar: 'رقم الهاتف هذا مستخدم بالفعل',
      });
    }

    // Find the current user
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    // Update user's phone number and Firebase UID
    const updateData = {
      phoneNumber: phone,
      firebaseUserId: firebaseUserId,
      isPhoneVerified: true, // Assuming phone verification happens via Firebase
    };

    await this.usersService.update(userId, updateData);

    return {
      message: {
        fr: 'Numéro de téléphone modifié avec succès',
        ar: 'تم تغيير رقم الهاتف بنجاح',
      },
      phone: phone,
    };
  }

  async checkPhoneExists(phone: string) {
    try {
      const user = await this.usersService.findUserByPhone(phone, true);

      if (user) {
        return {
          exists: true,
          message: {
            fr: 'Numéro de téléphone trouvé',
            ar: 'تم العثور على رقم الهاتف',
          },
        };
      } else {
        return {
          exists: false,
          message: {
            fr: 'Numéro de téléphone non trouvé',
            ar: 'لم يتم العثور على رقم الهاتف',
          },
        };
      }
    } catch (error) {
      throw new BadRequestException({
        fr: 'Erreur lors de la vérification du numéro',
        ar: 'خطأ في التحقق من الرقم',
      });
    }
  }
  /*


  registerVendor
  async registerArtisan(registerDto: ArtisanRegisterDto) {
    const user = await this.usersService.createArtisan({
      ...registerDto,
      role: Role.ARTISAN,
    });
    // await this.artisanService.createArtisan(user);
    const code = await this.otpService.createOtp(
      user.email,
      OtpType.VERIFY_EMAIL,
    );
    this.mailService.sendVerficationCodeEmail(
      user.email,
      code.toString(),
      OtpType.VERIFY_EMAIL,
    );
    await this.adminNotificationService.createNewUserNotification();
    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });
    if (registerDto.deviceToken) {
      await this.usersService.update(user.id, {
        deviceToken: registerDto.deviceToken,
      });
    }
    return { message: 'Inscription réussie', token };
  }*/

  async adminLogin(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email, true);
    if (!user || !user.password) {
      throw new BadRequestException('Email ou mot de passe incorrect');
    }
    const isPasswordValid = await Hash.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Email ou mot de passe incorrect');
    }
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        "Vous n'êtes pas autorisé à accéder à cette ressource",
      );
    }
    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });
    return { message: 'Connexion réussie', token };
  }

  // async getAuthUrl() {
  //     const url = this.client.generateAuthUrl({
  //         access_type: 'offline',
  //         scope: ['profile', 'email']
  //     });
  //     return {url};
  // }

  // async getToken(code: string) {
  //     const {tokens} = await this.client.getToken(code);
  //     const ticket = await this.client.verifyIdToken({
  //         idToken: tokens.id_token,
  //         audience: this.googleConfig.getGoogleClientId()
  //     });
  //     const payload = ticket.getPayload();
  //     const user = {
  //         email: payload.email,
  //         nom: payload.family_name,
  //         prenom: payload.given_name,
  //         picture: payload.picture
  //     }
  //     return await this.googleAuth(user, UserRole.CLIENT);
  // }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findUserByEmail(verifyEmailDto.email);
    if (!user) {
      throw new BadRequestException('Aucun utilisateur trouvé avec cet email');
    }
    const isCodeValid = await this.otpService.verifyOtp(
      user.email,
      verifyEmailDto.code,
      OtpType.VERIFY_EMAIL,
    );
    if (!isCodeValid) {
      throw new BadRequestException('Code invalide');
    }
    await this.usersService.update(user.id, { isEmailVerified: true });
    const token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });
    /*  if (user.role === Role.ARTISAN) {
      const artisan = await this.artisanService.findOne(user.id);
      artisanInfo = {
        isProfileCompleted: artisan.isProfileCompleted,
        isProfileVerified: artisan.isProfileVerified,
        hasBadge: artisan.badgeStatus === BadgeStatus.ACTIF,
        profileCompletionStep: artisan.profileCompletionStep,
        longitude: artisan.longitude,
        latitude: artisan.latitude,
      };
    }
      */
    return {
      message: 'Email vérifié avec succès',
      token,
      userInfo: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber ?? null,
        imgUrl: user.imgUrl ?? null,
      },
    };
  }
  async resendVerifyEmail(email: string, otpType: OtpType) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException({
        fr: 'Aucun utilisateur trouvé avec cet email',
        ar: 'لم يتم العثور على أي مستخدم بهذا البريد الإلكتروني',
        en: 'No user found with this email address',
      });
    }
    const code = await this.otpService.createOtp(user.email, otpType);
    this.mailService.sendVerficationCodeEmail(
      user.email,
      code.toString(),
      otpType,
    );
    return {
      message: {
        fr: 'Email de vérification envoyé',
        ar: 'تم إرسال البريد الإلكتروني للتحقق',
        en: 'Verification email sent',
      },
    };
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findUserByEmail(
      resetPasswordDto.email,
    );
    if (!user) {
      throw new BadRequestException({
        fr: 'Aucun utilisateur trouvé avec cet email',
        ar: 'لم يتم العثور على أي مستخدم بهذا البريد الإلكتروني',
        en: 'No user found with this email address',
      });
    }
    const isCodeValid = await this.otpService.verifyOtp(
      resetPasswordDto.email,
      resetPasswordDto.code,
      OtpType.RESET_PASSWORD,
    );
    if (!isCodeValid) {
      throw new BadRequestException({
        fr: 'Code invalide',
        en: 'invalide Code ',
        ar: 'رمز غير صالح',
      });
    }
    const newPassword = await Hash.hash(resetPasswordDto.newPassword);
    await this.usersService.update(user.id, { password: newPassword });
  }

  async checkAuth(req: Request) {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new BadRequestException('Token not found');
    }
    const token = authorization.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token);
    if (!payload) {
      throw new BadRequestException('Token invalide');
    }
    const user = await this.usersService.findUserByEmail(payload.email, true);
    if (!user) {
      throw new BadRequestException('Token invalide');
    }
    return { message: 'Token valide', success: true };
  }

  // Add this method to your UsersService class
  async submitContactForm(contactFormDto: ContactFormDto) {
    try {
      await this.mailService.sendContactFormEmail(contactFormDto);

      return {
        message:
          'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.',
        msgAr: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.',
        success: true,
      };
    } catch (error) {
      console.error('Error sending contact form email:', error);
      throw new BadRequestException({
        fr: "Erreur lors de l'envoi du message. Veuillez réessayer plus tard.",
        ar: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.',
      });
    }
  }

  async sendResetPasswordLink(sendResetLinkDto: SendResetLinkDto) {
    const { email, callbackUrl } = sendResetLinkDto;

    // Check if user exists
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException({
        fr: 'Aucun utilisateur trouvé avec cet email',
        ar: 'لم يتم العثور على أي مستخدم بهذا البريد الإلكتروني',
        en: 'No user found with this email address',
      });
    }

    // Generate reset token with 1 hour expiration
    const resetToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        type: 'PASSWORD_RESET',
      },
      {
        expiresIn: '1h', // Token expires in 1 hour
      },
    );

    // Create reset link
    const resetLink = `${callbackUrl}?token=${resetToken}`;

    // Send email with reset link
    await this.mailService.sendPasswordResetLinkEmail(
      user.email,
      resetLink,
      user.nom || user.prenom || 'User',
    );

    return {
      message: {
        fr: 'Un lien de réinitialisation de mot de passe a été envoyé à votre email',
        ar: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        en: 'A password reset link has been sent to your email',
      },
      success: true,
    };
  }

  async verifyResetToken(verifyResetTokenDto: VerifyResetTokenDto) {
    const { token } = verifyResetTokenDto;

    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync(token);

      // Check if token is for password reset
      if (payload.type !== 'PASSWORD_RESET') {
        throw new BadRequestException({
          fr: 'Token invalide',
          ar: 'رمز غير صالح',
          en: 'Invalid Token',
        });
      }

      // Check if user still exists
      const user = await this.usersService.findUserByEmail(payload.email);
      if (!user) {
        throw new BadRequestException({
          fr: 'Token invalide',
          ar: 'رمز غير صالح',
          en: 'Invalid Token',
        });
      }

      return {
        valid: true,
        message: {
          fr: 'Token valide',
          ar: 'رمز صالح',
          en: 'valid Token',
        },
        userEmail: payload.email,
      };
    } catch (error) {
      // Token is invalid or expired
      throw new BadRequestException({
        fr: 'Token invalide ou expiré',
        en: 'Invalide  Token or expired',
        ar: 'رمز غير صالح أو منتهي الصلاحية',
      });
    }
  }

  async resetPasswordWithToken(
    resetPasswordWithTokenDto: ResetPasswordWithTokenDto,
  ) {
    const { token, newPassword } = resetPasswordWithTokenDto;

    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync(token);

      // Check if token is for password reset
      if (payload.type !== 'PASSWORD_RESET') {
        throw new BadRequestException({
          fr: 'Token invalide',
          ar: 'رمز غير صالح',
          en: 'Invalid Token',
        });
      }

      // Find the user
      const user = await this.usersService.findUserByEmail(payload.email);
      if (!user) {
        throw new BadRequestException({
          fr: 'Token invalide',
          ar: 'رمز غير صالح',
          en: 'Invalid Token',
        });
      }

      // Hash the new password
      const hashedPassword = await Hash.hash(newPassword);

      // Update user password
      await this.usersService.update(user.id, {
        password: hashedPassword,
      });

      // Send confirmation email
      await this.mailService.sendPasswordResetConfirmationEmail(
        user.email,
        user.nom || user.prenom || 'User',
      );

      return {
        message: {
          fr: 'Mot de passe réinitialisé avec succès',
          ar: 'تم إعادة تعيين كلمة المرور بنجاح',
          en: 'Password reset successfully',
        },
        success: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Token is invalid or expired
      throw new BadRequestException({
        fr: 'Token invalide ou expiré',
        en: 'Invalide  Token or expired',

        ar: 'رمز غير صالح أو منتهي الصلاحية',
      });
    }
  }
}
