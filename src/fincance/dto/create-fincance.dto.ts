// src/finance/dto/create-withdrawal-request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Vendor ID (optional, defaults to authenticated user)',
  })
  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({
    example: 'Please process urgently',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
