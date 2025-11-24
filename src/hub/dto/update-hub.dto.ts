// hub/dto/update-hub.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateHubDto } from './create-hub.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHubDto extends PartialType(CreateHubDto) {
  @ApiPropertyOptional({
    description: 'Hub active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
