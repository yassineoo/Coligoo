// pickup-point/dto/create-pickup-point.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePickupPointDto {
  // ✅ Pickup Point specific fields
  @ApiProperty({
    description: 'Pickup Point name',
    example: 'Point de retrait Centre-ville',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Pickup Point address',
    example: '15 Rue Didouche Mourad, Alger',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Pickup Point latitude',
    example: 36.753768,
  })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Pickup Point longitude',
    example: 3.058756,
  })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    description: 'City ID where the pickup point is located',
    example: 556,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  cityId: number;

  @ApiPropertyOptional({
    description: 'Pickup Point phone number',
    example: '+213555123456',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Ouvert de 9h à 18h, fermé le vendredi',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Is the pickup point active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ✅ Admin user fields (same as Hub)
  @ApiProperty({
    description: 'Admin email',
    example: 'admin@pickuppoint.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'SecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'Admin first name',
    example: 'Ahmed',
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Admin last name',
    example: 'Benali',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description:
      'Admin phone number (can be different from pickup point phone)',
    example: '+213661234567',
  })
  @IsOptional()
  @IsString()
  adminPhoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Admin profile image file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;
}
