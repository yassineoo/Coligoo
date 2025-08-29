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

  @ApiProperty({ required: false, enum: ['homme', 'femme'], example: 'homme' })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiProperty({ required: false, example: '12/12/1997' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/)
  dob?: string;

  @ApiProperty({ required: false, example: '0541236987' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false, type: 'file' })
  img?: any;

  filename?: string;
}
