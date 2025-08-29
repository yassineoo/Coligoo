import { IsString, IsNotEmpty, IsEnum, IsEmail, IsOptional, IsArray, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from 'src/common/types/roles.enum';

export class CreateHubEmployeeDto {
  @ApiProperty({
    description: 'Employee email',
    example: 'employee@hub.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Employee password',
    example: 'SecurePassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'Hamza'
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Bouchanane'
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Hamza Bouchanane'
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Employee permissions',
    type: [String],
    example: ['orders.read', 'orders.write', 'customers.read']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15'
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '0549461543'
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['homme', 'femme'],
    example: 'homme'
  })
  @IsOptional()
  @IsEnum(['homme', 'femme'])
  sex?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @ApiPropertyOptional({
    description: 'Device token for notifications',
    example: 'device_token_here'
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}

export class UpdateHubEmployeeDto extends PartialType(CreateHubEmployeeDto) {
  @ApiPropertyOptional({
    description: 'Employee password (optional for updates)',
    example: 'NewSecurePassword123'
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class HubEmployeeFilterDto {
  @ApiPropertyOptional({
    description: 'Search by name (first name, last name, full name, or email)',
    example: 'Hamza'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: 'false'
  })
  @IsOptional()
  @IsString()
  blocked?: string;

  @ApiPropertyOptional({
    description: 'Filter by email verified status',
    example: 'true'
  })
  @IsOptional()
  @IsString()
  isEmailVerified?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Order by field',
    example: 'createdAt',
    enum: ['createdAt', 'nom', 'prenom', 'email']
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Order direction',
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

// For ADMIN role - can create any user type
export class CreateAdminUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'Hamza'
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Bouchanane'
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Hamza Bouchanane'
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User role',
    example: UserRole.HUB_ADMIN
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Hub ID for HUB_EMPLOYEE (required if role is HUB_EMPLOYEE)',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  hubId?: number;

  @ApiPropertyOptional({
    description: 'User permissions',
    type: [String],
    example: ['users.read', 'users.write', 'products.read']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];



  @ApiPropertyOptional({
    description: 'Phone number',
    example: '0549461543'
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;


  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @ApiPropertyOptional({
    description: 'Is user blocked',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @ApiPropertyOptional({
    description: 'Device token for notifications',
    example: 'device_token_here'
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {
  @ApiPropertyOptional({
    description: 'User password (optional for updates)',
    example: 'NewSecurePassword123'
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class AdminUserFilterDto {
  @ApiPropertyOptional({
    description: 'Search by name (first name, last name, full name, or email)',
    example: 'Hamza'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Filter by user role',
    example: UserRole.VENDOR
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: 'false'
  })
  @IsOptional()
  @IsString()
  blocked?: string;

  @ApiPropertyOptional({
    description: 'Filter by email verified status',
    example: 'true'
  })
  @IsOptional()
  @IsString()
  isEmailVerified?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Order by field',
    example: 'createdAt',
    enum: ['createdAt', 'nom', 'prenom', 'email', 'role']
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Order direction',
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}