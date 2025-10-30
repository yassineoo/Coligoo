import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum Sex {
  homme = 'homme',
  femme = 'femme',
}

export class UpdateUserInfoDto {
  @ApiProperty({ required: false, example: 'John' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ required: false, example: 'email@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '0541236987' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false, example: 594 })
  @IsOptional()
  @IsNumberString()
  cityId?: string;

  @ApiProperty({ required: false, example: 'address line 1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, type: 'file' })
  img?: any;

  filename?: string;
}
