import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({required: true, example: 'Electricite'})
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({required: true, example: 'كهرباء'})
    @IsNotEmpty()
    @IsString()
    ar_name: string;

    @ApiProperty({required: true, example: '#FFFFFF'})
    @IsNotEmpty()
    @IsString()
    @Matches(/^#([0-9a-f]{3}){1,2}$/i)
    color: string;

    @ApiProperty({required: true, type: 'file'})
    icon: any;

    fileName: string;
}
