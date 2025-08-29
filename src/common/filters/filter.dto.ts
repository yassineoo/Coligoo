import { ApiProperty } from "@nestjs/swagger";

export class FilterDto {
    @ApiProperty({required: true, default: 1})
    page: number = 1;

    @ApiProperty({required: true, default: 5})
    pageSize: number = 5;
}