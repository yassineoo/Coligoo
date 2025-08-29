import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateUserDto {}

export class UpdateUserStatusDto {
    @ApiProperty({required: true, example: true})
    @IsNotEmpty()
    @IsBoolean()
    blocked: boolean;
}
