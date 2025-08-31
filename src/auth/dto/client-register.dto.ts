import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { RegisterDto } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ClientRegisterDto extends RegisterDto {
  @ApiProperty({ example: '0654123987' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '12/10/2000' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/)
  dob?: string;


    @ApiProperty({ example: 'QSDQSDQSDQSQD' })
  @IsOptional()
  @IsString()
  firebaseUserId?: string;
  
}
