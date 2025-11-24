// hub/dto/create-hub.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHubDto {
  // Hub-specific fields
  @ApiProperty({
    description: 'Hub name',
    example: 'Hub Central Alger',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Hub address',
    example: '123 Rue de la Liberté, Alger, Algérie',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Hub latitude',
    example: 36.737232,
  })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Hub longitude',
    example: 3.086472,
  })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    description: 'City ID where the hub is located',
    example: 556,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  cityId: number;

  // Admin user fields
  @ApiProperty({
    description: 'Admin email',
    example: 'admin@hub.com',
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
    example: 'Hamza',
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Admin last name',
    example: 'Bouchanane',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Admin phone number',
    example: '+213549461543',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Hub admin permissions',
    type: [String],
    example: [
      'view.packages',
      'edit.packageStatus',
      'access.financialPage',
      'manage.teamMembers',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // ✅ This validates each item is a string
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Admin profile image file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;
}
