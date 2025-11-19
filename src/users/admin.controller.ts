import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  AdminUserFilterDto,
} from './dto/admin.dto';
import { User } from './entities/user.entity';
import { UserRole } from 'src/common/types/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PaginatedResponse } from 'src/common/utils/paginated-response';
import { AdminService } from './admin-service';

@ApiTags('Admin - User Management')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or email already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async createUser(
    @Body() createAdminUserDto: CreateAdminUserDto,
  ): Promise<User> {
    return await this.adminService.createUser(createAdminUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllUsers(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllUsers(adminUserFilterDto);
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({
    status: 200,
    description: 'Admin users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllAdmins(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllAdmins(adminUserFilterDto);
  }

  @Get('hub-admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all hub admin users' })
  @ApiResponse({
    status: 200,
    description: 'Hub admin users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllHubAdmins(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllHubAdmins(adminUserFilterDto);
  }

  @Get('moderators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all moderator users' })
  @ApiResponse({
    status: 200,
    description: 'Moderator users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllModerators(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllModerators(adminUserFilterDto);
  }

  @Get('vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all vendor users' })
  @ApiResponse({
    status: 200,
    description: 'Vendor users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllVendors(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllVendors(adminUserFilterDto);
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all client users' })
  @ApiResponse({
    status: 200,
    description: 'Client users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllClients(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllClients(adminUserFilterDto);
  }

  @Get('deliverymen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all deliveryman users' })
  @ApiResponse({
    status: 200,
    description: 'Deliveryman users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllDeliverymen(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllDeliverymen(adminUserFilterDto);
  }

  @Get('hub-employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all hub employee users' })
  @ApiResponse({
    status: 200,
    description: 'Hub employee users retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findAllHubEmployees(
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.findAllHubEmployees(adminUserFilterDto);
  }

  @Get('hub/:hubAdminId/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get employees for a specific hub admin' })
  @ApiParam({ name: 'hubAdminId', description: 'Hub Admin ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Hub employees retrieved successfully',
    type: PaginatedResponse<User>,
  })
  @ApiResponse({
    status: 404,
    description: 'Hub admin not found',
  })
  async getHubEmployees(
    @Param('hubAdminId', ParseIntPipe) hubAdminId: number,
    @Query() adminUserFilterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.adminService.getHubEmployees(
      hubAdminId,
      adminUserFilterDto,
    );
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system-wide user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStatistics(): Promise<{
    total: number;
    admins: number;
    hubAdmins: number;
    moderators: number;
    vendors: number;
    clients: number;
    deliverymen: number;
    hubEmployees: number;
    blocked: number;
    verified: number;
  }> {
    return await this.adminService.getUserStatistics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.adminService.findUserById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<User> {
    return await this.adminService.updateUser(id, updateAdminUserDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status (block/unblock)' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('blocked') blocked: boolean,
  ): Promise<{ message: string }> {
    return await this.adminService.updateUserStatus(id, blocked);
  }

  @Patch(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user permissions' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'User permissions updated successfully',
    type: User,
  })
  async updateUserPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissions', new ParseArrayPipe({ items: String }))
    permissions: string[],
  ): Promise<User> {
    return await this.adminService.updateUserPermissions(id, permissions);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete hub admin with employees',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return await this.adminService.deleteUser(id);
  }

  @Patch('bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk update user status' })
  @ApiResponse({
    status: 200,
    description: 'Users status updated successfully',
  })
  async bulkUpdateUserStatus(
    @Body('userIds', new ParseArrayPipe({ items: Number })) userIds: number[],
    @Body('blocked') blocked: boolean,
  ): Promise<{ message: string; updated: number }> {
    return await this.adminService.bulkUpdateUserStatus(userIds, blocked);
  }

  @Delete('bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({
    status: 200,
    description: 'Users deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete hub admins with employees',
  })
  async bulkDeleteUsers(
    @Body('userIds', new ParseArrayPipe({ items: Number })) userIds: number[],
  ): Promise<{ message: string; deleted: number }> {
    return await this.adminService.bulkDeleteUsers(userIds);
  }
}
