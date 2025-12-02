import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsEmail,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from 'src/common/types/roles.enum';

export class CreateTeamMemberDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'Hamza',
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Bouchanane',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+213549461543',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User role',
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Team member permissions',
    type: [String],
    example: [
      'view.packages',
      'edit.packageStatus',
      'access.financialPage',
      'manage.teamMembers',
      'view.printReports',
      'access.settings',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value]; // fallback for single string input
    }
  })
  permissions?: string[];

  fileName: string;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {
  @ApiPropertyOptional({
    description: 'User password (optional for updates)',
    example: 'NewSecurePassword123',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Is user blocked',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}

export class HubEmployeeFilterDto {
  @ApiPropertyOptional({
    description: 'Search by name (first name, last name, full name, or email)',
    example: 'Hamza',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: 'false',
  })
  @IsOptional()
  @IsString()
  blocked?: string;

  @ApiPropertyOptional({
    description: 'Filter by email verified status',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  isEmailVerified?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Order by field',
    example: 'createdAt',
    enum: ['createdAt', 'nom', 'prenom', 'email', 'fullName'],
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Order direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

// For ADMIN role - can create any user type
export class CreateAdminUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'Hamza',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Bouchanane',
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Hamza Bouchanane',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User role',
    example: UserRole.HUB_ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Hub ID for HUB_EMPLOYEE (required if role is HUB_EMPLOYEE)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  hubAdminId?: number;

  @ApiPropertyOptional({
    description: 'User permissions',
    type: [String],
    example: ['users.read', 'users.write', 'products.read'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '0549461543',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @ApiPropertyOptional({
    description: 'Is user blocked',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @ApiPropertyOptional({
    description: 'Device token for notifications',
    example: 'device_token_here',
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {
  @ApiPropertyOptional({
    description: 'User password (optional for updates)',
    example: 'NewSecurePassword123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class AdminUserFilterDto {
  @ApiPropertyOptional({
    description: 'Search by name (first name, last name, full name, or email)',
    example: 'Hamza',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Filter by user role',
    example: UserRole.VENDOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: 'false',
  })
  @IsOptional()
  @IsString()
  blocked?: string;

  @ApiPropertyOptional({
    description: 'Filter by email verified status',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  isEmailVerified?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Order by field',
    example: 'createdAt',
    enum: ['createdAt', 'nom', 'prenom', 'email', 'role'],
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Order direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkDeleteEmployeesDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of employee IDs to delete',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  employeeIds: number[];
}
