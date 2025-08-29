import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class EmailDto {
    @ApiProperty({required: true, example: 'test@example.com'})
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}