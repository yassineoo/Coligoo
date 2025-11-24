import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { RegisterDto } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ClientRegisterDto extends RegisterDto {
  @ApiProperty({ example: '0654123987' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'QSDQSDQSDQSQD' })
  @IsOptional()
  @IsString()
  code?: string;
}
