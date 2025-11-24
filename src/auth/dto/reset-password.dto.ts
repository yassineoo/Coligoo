import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { VerifyEmailDto } from './verify-email.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto extends VerifyEmailDto {
  @ApiProperty({ required: true, example: 'password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class changePhoneDto {
  @ApiProperty({
    example: '+213551234567',
    description: 'User phone number in international format',
  })
  phone: string;

  @ApiProperty({
    example: 'firebase-uid-123456789',
    description: 'Unique Firebase user ID for authentication',
  })
  code: string;
}

// New DTOs for phone-based authentication
export class SendPhoneOtpDto {
  phone: string;
}

export class SendResetLinkDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Callback URL for password reset',
    example: 'https://yourapp.com/reset-password',
  })
  //  @IsUrl()
  @IsNotEmpty()
  callbackUrl: string;
}

export class VerifyResetTokenDto {
  @ApiProperty({
    description: 'Reset password token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// dto/reset-password-with-token.dto.ts

export class ResetPasswordWithTokenDto {
  @ApiProperty({
    description: 'Reset password token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
