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