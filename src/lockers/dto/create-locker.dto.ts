// src/lockers/dto/create-locker.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OperatingHours } from '../entities/locker.entity';

export class CreateLockerDto {
  @ApiProperty({ example: 'Downtown Locker Station' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'حي السلام، شارع الاستقلال' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 36.737232, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;
  @ApiPropertyOptional({ example: 3.086472, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ example: 1, description: 'City ID' })
  @IsNumber()
  @Type(() => Number)
  cityId: number;

  @ApiProperty({ example: 20, description: 'Total number of closets' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @ApiPropertyOptional({
    example: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' },
    },
    description: 'Operating hours (defaults to 08:00-22:00 if not provided)',
  })
  @IsOptional()
  @IsObject()
  operatingHours?: OperatingHours;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  /*
  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
  */
}
