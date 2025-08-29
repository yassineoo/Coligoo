import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LoginDto } from './dto/login.dto';
import { EmailDto } from './dto/email.dto';
import { OtpType } from './types/otp-type.enum';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { OtpService } from './otp.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ClientRegisterDto } from './dto/client-register.dto';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('/register-delivery-men')
  async registerDeliveryMen(@Body() registerDto: ClientRegisterDto) {
    return await this.authService.registerClient(registerDto);
  }

  @Post('/register-vendor')
  async registervendor(@Body() registerDto: RegisterDto) {
    return await this.authService.registerVendor(registerDto);
  }

  @Post('/login-admin')
  @HttpCode(200)
  async adminLogin(@Body() loginDto: LoginDto) {
    return await this.authService.adminLogin(loginDto);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /*
  @Post('/register-artisan')
  async registerArtisan(@Body() registerDto: ArtisanRegisterDto) {
    // return await this.authService.registerArtisan(registerDto);
  }
  */

  // @Get("/client/google")
  // @UseGuards(GoogleOauthClientGuard)
  // async clientGoogleAuth() {}

  // @Get("/client/google/callback")
  // @UseGuards(GoogleOauthClientGuard)
  // async clientGoogleAuthCallback(@Req() req) {
  //   return await this.authService.googleAuth(req.user, Role.CLIENT);
  //   // return await this.authService.getToken(req.query.code);
  // }

  @ApiBearerAuth()
  @Get('/check-auth')
  async checkAuth(@Req() req: Request) {
    return await this.authService.checkAuth(req);
  }

  // @Get("/artisan/google")
  // @UseGuards(GoogleOauthArtisanGuard)
  // async artisanGoogleAuth() {}

  // @Get("/artisan/google/callback")
  // @UseGuards(GoogleOauthArtisanGuard)
  // async artisanGoogleAuthCallback(@Req() req) {
  //   return await this.authService.googleAuth(req.user, Role.ARTISAN);
  // }

  // @Get("/get-auth-url")
  // async getAuthUrl() {
  //   return await this.authService.getAuthUrl();
  // }

  @Post('/verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('/resend-verify-email')
  @HttpCode(200)
  async resendVerifyEmail(@Body() emailDto: EmailDto) {
    return await this.authService.resendVerifyEmail(
      emailDto.email,
      OtpType.VERIFY_EMAIL,
    );
  }

  @Post('/forget-password')
  @HttpCode(200)
  async forgetPassword(@Body() emailDto: EmailDto) {
    return await this.authService.resendVerifyEmail(
      emailDto.email,
      OtpType.RESET_PASSWORD,
    );
  }

  @Post('/verify-password-otp')
  @HttpCode(200)
  async verifyPasswordOtp(@Body() verifyEmailDto: VerifyEmailDto) {
    const isCodeValid = await this.otpService.verifyOtp(
      verifyEmailDto.email,
      verifyEmailDto.code,
      OtpType.RESET_PASSWORD,
    );
    return { isCodeValid };
  }

  @Post('/reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
