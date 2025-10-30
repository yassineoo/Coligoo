// Updated otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OtpType } from './types/otp-type.enum';
import { DataSource } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Normalize Algerian phone number to international format (+213XXXXXXXXX)
   * Handles three formats:
   * - 07747074589 (local format with leading 0)
   * - 213747074589 (country code without +)
   * - +213747074589 (already formatted)
   */
  private normalizeAlgerianPhone(phone: string): string {
    // Remove any whitespace
    const cleaned = phone.trim().replace(/\s/g, '');

    // Case 1: Already has + prefix (e.g., +213747074589)
    if (cleaned.startsWith('+213')) {
      return cleaned;
    }

    // Case 2: Has country code without + (e.g., 213747074589)
    if (cleaned.startsWith('213') && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    // Case 3: Local format with leading 0 (e.g., 07747074589)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+213${cleaned.substring(1)}`; // Remove 0 and add +213
    }

    // If none of the above, assume it needs +213 prefix
    // This handles cases like 7747074589 (9 digits without leading 0)
    if (cleaned.length === 9 && /^\d{9}$/.test(cleaned)) {
      return `+213${cleaned}`;
    }

    // Return as is with + if it doesn't match any pattern
    // (let validation happen elsewhere)
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Create OTP - identifier can be email or phone based on type
   */
  async createOtp(identifier: string, type: OtpType): Promise<number> {
    const code = Math.floor(100000 + Math.random() * 900000);
    //const code = 123456; // For testing purposes, use a fixed OTP
    const otpRepository = this.dataSource.getRepository(Otp);

    // Determine if identifier is email or phone
    const isEmail =
      type === OtpType.VERIFY_EMAIL || type === OtpType.RESET_PASSWORD;
    const isPhone =
      type === OtpType.VERIFY_PHONE || type === OtpType.RESET_PASSWORD_PHONE;

    // Format phone number if it's a phone type
    let formattedIdentifier = identifier;
    if (isPhone) {
      formattedIdentifier = this.normalizeAlgerianPhone(identifier);
    }

    // Check if OTP already exists
    const whereClause = isEmail
      ? { email: formattedIdentifier, type }
      : { phone: formattedIdentifier, type };

    const existingOtp = await otpRepository.findOneBy(whereClause);
    console.log(existingOtp);

    let result;
    if (existingOtp) {
      result = await otpRepository.update(whereClause, {
        otp: code.toString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
      });
    } else {
      const otpData = {
        otp: code.toString(),
        type,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        ...(isEmail
          ? { email: formattedIdentifier }
          : { phone: formattedIdentifier }),
      };

      result = await otpRepository.save(otpData);
    }
    console.log(result);

    this.logger.log(
      `OTP created for ${formattedIdentifier}, type: ${type}, code: ${code}`,
    );

    // Send SMS for phone verification
    if (isPhone) {
      try {
        const smsResponse = await this.smsService.sendOtp(
          formattedIdentifier,
          code.toString(),
        );

        this.logger.log(
          `OTP SMS sent to ${formattedIdentifier}, response: ${smsResponse}`,
        );
      } catch (error) {
        this.logger.error(`Failed to send OTP SMS: ${error.message}`);
        // Delete the OTP if SMS sending fails
        await otpRepository.delete(whereClause);
        throw error;
      }
    }

    return code;
  }

  /**
   * Verify OTP - standard verification only
   */
  async verifyOtp(
    identifier: string,
    otp: string,
    type: OtpType,
    noDeleteOtp: boolean = false,
  ): Promise<boolean> {
    const otpRepository = this.dataSource.getRepository(Otp);
    const isEmail =
      type === OtpType.VERIFY_EMAIL || type === OtpType.RESET_PASSWORD;

    // Format phone number if needed
    let formattedIdentifier = identifier;
    if (!isEmail) {
      formattedIdentifier = this.normalizeAlgerianPhone(identifier);
    }

    const whereClause = isEmail
      ? { email: formattedIdentifier, type }
      : { phone: formattedIdentifier, type };

    const storedOtp = await otpRepository.findOneBy(whereClause);

    if (!storedOtp) {
      this.logger.warn(
        `No OTP found for ${formattedIdentifier}, type: ${type}`,
      );
      return false;
    }

    if (storedOtp.otp !== otp) {
      this.logger.warn(`Invalid OTP provided for ${formattedIdentifier}`);
      return false;
    }

    if (storedOtp.expiresAt < new Date()) {
      this.logger.warn(`Expired OTP for ${formattedIdentifier}`);
      return false;
    }

    // Delete OTP after successful verification
    if (!noDeleteOtp) await otpRepository.delete(whereClause);

    this.logger.log(
      `OTP verified successfully for ${formattedIdentifier}, type: ${type}`,
    );
    return true;
  }

  /**
   * Send password reset OTP via SMS
   */
  async sendPasswordResetOtp(phone: string, code: string): Promise<void> {
    const formattedPhone = this.normalizeAlgerianPhone(phone);

    try {
      // await this.smsService.sendPasswordResetOtp(formattedPhone, code);
      this.logger.log(`Password reset OTP sent to ${formattedPhone}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP: ${error.message}`);
      throw error;
    }
  }
}
