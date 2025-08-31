import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { VerifyEmailDto } from "./verify-email.dto";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto extends VerifyEmailDto {
    @ApiProperty({required: true, example: "password"})
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
  firebaseUserId: string;


}




// New DTOs for phone-based authentication
export class SendPhoneOtpDto {
  phone: string;
}
