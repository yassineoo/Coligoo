// sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // SMS API Configuration
  private readonly SMS_API_URL =
    'https://smsapi.icosnet.com:8443/bulksms/bulksms';

  private readonly USERNAME = 'Khedamni';
  private readonly PASSWORD = 'SMS5076';
  private readonly SOURCE = 'ICOTEST'; // Your app name or sender ID (max 11 chars)

  /**
   * Send OTP via SMS
   */
  async sendOtp(phone: string, code: string): Promise<boolean> {
    try {
      // Format phone number - ensure it has country code without +
      // Example: +213XXXXXXXXX becomes 213XXXXXXXXX
      const destination = phone.replace(/^\+/, '');

      // Create the OTP message
      const message = `Your Khedamni verification code is: ${code}. Valid for 10 minutes.`;

      // Build URL with parameters - note the order matters
      const params = {
        username: this.USERNAME,
        password: this.PASSWORD,
        type: '0', // Plain text (GSM 3.38)
        dlr: '1', // Request delivery report
        destination: destination,
        source: this.SOURCE,
        message: message,
      };

      // Construct URL manually to ensure proper encoding
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.SMS_API_URL}?${queryString}`;

      this.logger.debug(`Sending SMS to: ${destination}`);
      this.logger.debug(`Full URL: ${url}`);

      // Send the SMS using axios with proper config
      const response = await axios.get(url, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Don't follow redirects
        maxRedirects: 0,
        validateStatus: (status) => status < 500, // Accept any status < 500
      });

      this.logger.log(`SMS API Response Status: ${response.status}`);
      this.logger.log(
        `SMS API Response Data: ${JSON.stringify(response.data)}`,
      );

      // Check if response contains error code
      const responseText = String(response.data);

      // Success response format: 1701|<CELL_NO>|<MESSAGE_ID>
      if (responseText.includes('1701')) {
        this.logger.log(`OTP SMS sent successfully to ${phone}`);
        return true;
      } else {
        // Log the error
        this.logger.error(`SMS API Error Response: ${responseText}`);

        // Parse error code
        const errorMatch = responseText.match(/^(\d+)/);
        if (errorMatch) {
          const errorCode = errorMatch[1];
          this.logger.error(
            `SMS API Error Code: ${errorCode} - ${this.getErrorMessage(
              errorCode,
            )}`,
          );
        }

        throw new Error(`SMS sending failed: ${responseText}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Axios Error: ${error.message}`);
        this.logger.error(
          `Response Data: ${JSON.stringify(error.response?.data)}`,
        );
        this.logger.error(`Status Code: ${error.response?.status}`);
      } else {
        this.logger.error(`Failed to send OTP SMS to ${phone}:`, error.message);
      }
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Send password reset OTP via SMS
   */
  async sendPasswordResetOtp(phone: string, code: string): Promise<boolean> {
    try {
      const destination = phone.replace(/^\+/, '');

      const message = `Your Khedamni password reset code is: ${code}. Valid for 10 minutes.`;

      const params = {
        username: this.USERNAME,
        password: this.PASSWORD,
        type: '0',
        dlr: '1',
        destination: destination,
        source: this.SOURCE,
        message: message,
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.SMS_API_URL}?${queryString}`;

      this.logger.debug(`Sending password reset SMS to: ${destination}`);

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });

      this.logger.log(
        `Password reset SMS API Response: ${JSON.stringify(response.data)}`,
      );

      const responseText = String(response.data);

      if (responseText.includes('1701')) {
        this.logger.log(`Password reset OTP SMS sent successfully to ${phone}`);
        return true;
      } else {
        this.logger.error(`SMS API Error Response: ${responseText}`);
        throw new Error(`SMS sending failed: ${responseText}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Axios Error: ${error.message}`);
        this.logger.error(
          `Response Data: ${JSON.stringify(error.response?.data)}`,
        );
      } else {
        this.logger.error(
          `Failed to send password reset SMS to ${phone}:`,
          error.message,
        );
      }
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Send custom SMS message
   */
  async sendCustomMessage(phone: string, message: string): Promise<boolean> {
    try {
      const destination = phone.replace(/^\+/, '');

      const params = {
        username: this.USERNAME,
        password: this.PASSWORD,
        type: '0',
        dlr: '1',
        destination: destination,
        source: this.SOURCE,
        message: message,
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.SMS_API_URL}?${queryString}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });

      this.logger.log(`Custom SMS sent successfully to ${phone}`);

      const responseText = String(response.data);

      if (responseText.includes('1701')) {
        return true;
      } else {
        throw new Error(`SMS sending failed: ${responseText}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send custom SMS to ${phone}:`,
        error.message,
      );
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Get human-readable error message from error code
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      '1701': 'Success, Message Submitted Successfully',
      '1702': 'Invalid URL - Parameter missing or blank',
      '1703': 'Invalid username or password',
      '1704': 'Invalid type field',
      '1705': 'Invalid message',
      '1706': 'Invalid destination',
      '1707': 'Invalid source (Sender)',
      '1709': 'User validation failed',
      '1710': 'Internal error',
      '1025': 'Insufficient credit',
      '1715': 'Response timeout',
      '1032': 'DND reject',
      '1028': 'Spam message',
      '1041': 'Duplicate message',
      '1042': 'Explicit DND Destination',
      '1033': 'Message Template Mismatch',
      '69': 'Internal Error',
      '8': 'Internal Error',
      '16': 'IP Blacklisted',
      '18': 'Non Whitelisted User IP',
    };

    return errorMessages[errorCode] || 'Unknown error';
  }
}
