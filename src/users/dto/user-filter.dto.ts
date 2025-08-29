import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";
import { FilterDto } from "src/common/filters/filter.dto";
import { UserOrderBy } from "../types/order-by.enum";
import { Order } from "src/common/types/order.enum";

export class UserFilterDto extends FilterDto {
    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    nom: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsBooleanString()
    blocked: string;

    @ApiProperty({required: false, enum: UserOrderBy})
    @IsOptional()
    @IsEnum(UserOrderBy)
    orderBy: UserOrderBy;

    @ApiProperty({required: false, enum: Order})
    @IsOptional()
    @IsEnum(Order)
    order: Order;
}