import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EmailDto {
  @ApiProperty({ required: true, example: 'test@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}

export class ContactFormDto {
  @ApiProperty({
    description: 'Email address of the person submitting the contact form',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Full name of the person submitting the contact form',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName: string;

  @ApiProperty({
    description: 'Subject line of the contact message',
    example: 'Inquiry about your services',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'subject must be a string' })
  @IsNotEmpty({ message: 'subject is required' })
  @MaxLength(500, { message: 'subject must not exceed 500 characters' })
  subject: string;

  @ApiProperty({
    description: 'The main content of the contact message',
    example:
      'Hello, I would like to know more about your services and pricing options. Please contact me at your earliest convenience.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  @MaxLength(2000, { message: 'Message must not exceed 1000 characters' })
  message: string;
}
