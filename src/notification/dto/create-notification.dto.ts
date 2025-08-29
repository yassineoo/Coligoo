import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { NotificationReceiver } from "../types/notifcation-receiver.enum";

export class CreateNotifcationDto {
    @ApiProperty({required: true, example: 'example'})
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({required: true, example: ['client']})
    @IsNotEmpty()
    @IsEnum(NotificationReceiver, {each: true})
    receivers: NotificationReceiver[];
}