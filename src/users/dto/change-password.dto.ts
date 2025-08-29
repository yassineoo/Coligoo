import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({required: true, example: 'password'})
    @IsNotEmpty()
    @IsString()
    oldPassword: string;

    @ApiProperty({required: true, example: 'newpassword'})
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    newPassword: string;
}