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
  ParseArrayPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam
} from '@nestjs/swagger';
import { CreateHubEmployeeDto, UpdateHubEmployeeDto, HubEmployeeFilterDto } from './dto/admin.dto';
import { User } from './entities/user.entity';
import { HubAdminService } from './hub-admin.service';
import { UserRole } from 'src/common/types/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginatedResponse } from 'src/common/utils/paginated-response';

@ApiTags('Hub Admin - Employee Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HUB_ADMIN)
@Controller('hub-admin/employees')
export class HubAdminController {
  constructor(private readonly hubAdminService: HubAdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee (Hub Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
    type: User
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or email already exists'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Hub Admin role required'
  })
  async createEmployee(
    @Body() createHubEmployeeDto: CreateHubEmployeeDto,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<User> {
    return await this.hubAdminService.createHubEmployee(createHubEmployeeDto, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my employees with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
    type: PaginatedResponse<User>
  })
  async findMyEmployees(
    @Query() hubEmployeeFilterDto: HubEmployeeFilterDto,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<PaginatedResponse<User>> {
    return await this.hubAdminService.findMyEmployees(currentUser.userId, hubEmployeeFilterDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get my employee statistics' })
  @ApiResponse({
    status: 200,
    description: 'Employee statistics retrieved successfully'
  })
  async getMyEmployeeStatistics(
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    blockedEmployees: number;
    verifiedEmployees: number;
  }> {
    return await this.hubAdminService.getMyEmployeeStatistics(currentUser.userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get my hub admin profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: User
  })
  async getMyProfile(
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<User> {
    return await this.hubAdminService.getHubAdminProfile(currentUser.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
    type: User
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied'
  })
  async findEmployeeById(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<User> {
    return await this.hubAdminService.findEmployeeById(id, currentUser.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: User
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied'
  })
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHubEmployeeDto: UpdateHubEmployeeDto,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<User> {
    return await this.hubAdminService.updateEmployee(id, currentUser.userId, updateHubEmployeeDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update employee status (block/unblock)' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee status updated successfully'
  })
  async updateEmployeeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('blocked') blocked: boolean,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<{ msg: string }> {
    return await this.hubAdminService.updateEmployeeStatus(id, currentUser.userId, blocked);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Update employee permissions' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee permissions updated successfully',
    type: User
  })
  async updateEmployeePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissions', new ParseArrayPipe({ items: String })) permissions: string[],
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<User> {
    return await this.hubAdminService.updateEmployeePermissions(id, currentUser.userId, permissions);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied'
  })
  async deleteEmployee(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<{ msg: string }> {
    return await this.hubAdminService.deleteEmployee(id, currentUser.userId);
  }

  @Patch('bulk/status')
  @ApiOperation({ summary: 'Bulk update employee status' })
  @ApiResponse({
    status: 200,
    description: 'Employees status updated successfully'
  })
  async bulkUpdateEmployeeStatus(
    @Body('employeeIds', new ParseArrayPipe({ items: Number })) employeeIds: number[],
    @Body('blocked') blocked: boolean,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<{ msg: string; updated: number }> {
    return await this.hubAdminService.bulkUpdateEmployeeStatus(employeeIds, currentUser.userId, blocked);
  }

  @Delete('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees deleted successfully'
  })
  async bulkDeleteEmployees(
    @Body('employeeIds', new ParseArrayPipe({ items: Number })) employeeIds: number[],
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<{ msg: string; deleted: number }> {
    return await this.hubAdminService.bulkDeleteEmployees(employeeIds, currentUser.userId);
  }
}