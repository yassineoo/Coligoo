import { ApiProperty } from "@nestjs/swagger";
import { EmailDto } from "./email.dto";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class VerifyEmailDto extends EmailDto {
    @ApiProperty({required: true, example: '123456'})
    @IsNotEmpty()
    @IsNumberString()
    code: string;
}