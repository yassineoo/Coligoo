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
import { changePhoneDto, ResetPasswordDto } from './dto/reset-password.dto';
import { ClientRegisterDto } from './dto/client-register.dto';

import { Request } from 'express';
import { AdminNotificationService } from 'src/notification/admin-notification.service';
import { UserRole } from 'src/common/types/roles.enum';
import { RegisterDto } from './dto/register.dto';

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

    return { msg: 'Inscription réussie', token ,userInfo:user };
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

    return { msg: 'Inscription réussie', token };
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
    msg: {
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
    return { msg: 'Inscription réussie', token };
  }*/
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email, true);
    if (!user || !user.password) {
      throw new BadRequestException({
        fr: 'Email ou mot de passe incorrect',
        ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
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
    if (user.blocked) {
      throw new BadRequestException({
        fr: 'Votre compte a été bloqué !',
        ar: 'تم حظر حسابك',
      });
    }
    /*
    if (user.role === Role.ARTISAN) {
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
      msg: 'Connexion réussie',
      token,
      userInfo: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber ?? null,
        imgUrl: user.imgUrl ?? null,
        sex: user.sex ?? null,
        dob: user.dob?.toISOString().split('T')[0] ?? null,
      },
    };
  }
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
    return { msg: 'Connexion réussie', token };
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
      msg: 'Email vérifié avec succès',
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
        sex: user.sex ?? null,
        dob: user.dob?.toISOString().split('T')[0] ?? null,
      },
    };
  }
  async resendVerifyEmail(email: string, otpType: OtpType) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException({
        fr: 'Aucun utilisateur trouvé avec cet email',
        ar: 'لم يتم العثور على أي مستخدم بهذا البريد الإلكتروني',
      });
    }
    const code = await this.otpService.createOtp(user.email, otpType);
    this.mailService.sendVerficationCodeEmail(
      user.email,
      code.toString(),
      otpType,
    );
    return { msg: 'Email de vérification envoyé' };
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findUserByEmail(
      resetPasswordDto.email,
    );
    if (!user) {
      throw new BadRequestException({
        fr: 'Aucun utilisateur trouvé avec cet email',
        ar: 'لم يتم العثور على أي مستخدم بهذا البريد الإلكتروني',
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
    return { msg: 'Token valide', success: true };
  }
}
