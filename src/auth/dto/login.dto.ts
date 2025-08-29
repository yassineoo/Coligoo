import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty({required: true, example: "admin@admin.com"})
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({required: true, example: "adminadmin"})
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({required: false, example: "token"})
    @IsOptional()
    @IsString()
    deviceToken?: string;
}

export class GoogleLoginDto {
    @ApiProperty({required: true, example: "token"})
    @IsNotEmpty()
    @IsString()
    idToken: string;

    @ApiProperty({required: true, example: "token"})
    @IsNotEmpty()
    @IsString()
    deviceToken: string;
}

export class AppleLoginDto {
    @ApiProperty({required: true, example: "token"})
    @IsNotEmpty()
    @IsString()
    idToken: string;

    @ApiProperty({required: true, example: "token"})
    @IsNotEmpty()
    @IsString()
    deviceToken: string;
}