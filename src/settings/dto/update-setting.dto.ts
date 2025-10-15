// src/settings/dto/update-setting.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  // ===========================
  // WEIGHT SETTINGS
  // ===========================

  @ApiPropertyOptional({
    example: 10,
    description: 'Free weight limit in KG (no extra charge below this)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeWeightLimit?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Price per KG when weight exceeds free limit',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightPricePerKg?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum allowed weight in KG',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeightLimit?: number;

  // ===========================
  // VOLUME SETTINGS
  // ===========================

  @ApiPropertyOptional({
    example: 50000,
    description: 'Free volume limit in cm³ (no extra charge below this)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeVolumeLimit?: number;

  @ApiPropertyOptional({
    example: 0.001,
    description: 'Price per cm³ when volume exceeds free limit',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volumePricePerCm3?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Maximum allowed volume in cm³',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxVolumeLimit?: number;
}

export class SettingsResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 10,
    description: 'Free weight limit in KG',
  })
  freeWeightLimit: number;

  @ApiProperty({
    example: 50,
    description: 'Price per KG when weight exceeds free limit',
  })
  weightPricePerKg: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum allowed weight in KG',
  })
  maxWeightLimit: number;

  @ApiProperty({
    example: 50000,
    description: 'Free volume limit in cm³',
  })
  freeVolumeLimit: number;

  @ApiProperty({
    example: 0.001,
    description: 'Price per cm³ when volume exceeds free limit',
  })
  volumePricePerCm3: number;

  @ApiProperty({
    example: 500000,
    description: 'Maximum allowed volume in cm³',
  })
  maxVolumeLimit: number;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T12:30:00Z' })
  updatedAt: Date;
}
