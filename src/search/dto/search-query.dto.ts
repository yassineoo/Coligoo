import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { FilterDto } from "src/common/filters/filter.dto";

export class SearchQueryDto extends FilterDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    query: string;
}