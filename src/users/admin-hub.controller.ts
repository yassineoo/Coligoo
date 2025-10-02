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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  HubEmployeeFilterDto,
  BulkDeleteEmployeesDto,
} from './dto/admin.dto';
import { User } from './entities/user.entity';
import { HubAdminService } from './hub-admin.service';
import { UserRole } from 'src/common/types/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginatedResponse } from 'src/common/utils/paginated-response';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Hub Admin - Employee Management')
@ApiBearerAuth()
@Controller('hub-admin/employees')
export class HubAdminController {
  constructor(private readonly hubAdminService: HubAdminService) {}

  // Updated endpoints in hub-admin.controller.ts

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imgUrl', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Create a new employee (Hub Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
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
    description: 'Forbidden - Hub Admin role required',
  })
  async createEmployee(
    @UploadedFile() profileImage: Express.Multer.File,
    @Body() createHubEmployeeDto: CreateTeamMemberDto,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<User> {
    console.log('imgUrl', profileImage);

    if (profileImage) {
      createHubEmployeeDto.fileName = profileImage.filename;
    }
    return await this.hubAdminService.createHubEmployee(
      createHubEmployeeDto,
      currentUser.userId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Update an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied',
  })
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() profileImage: Express.Multer.File,
    @Body() updateHubEmployeeDto: UpdateTeamMemberDto,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<User> {
    if (profileImage) {
      updateHubEmployeeDto.fileName = profileImage.filename;
    }
    return await this.hubAdminService.updateEmployee(
      id,
      currentUser.userId,
      updateHubEmployeeDto,
    );
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Get all my employees with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
    type: PaginatedResponse<User>,
  })
  async findMyEmployees(
    @Query() hubEmployeeFilterDto: HubEmployeeFilterDto,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<PaginatedResponse<User>> {
    return await this.hubAdminService.findMyEmployees(
      currentUser.userId,
      hubEmployeeFilterDto,
    );
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Get my employee statistics' })
  @ApiResponse({
    status: 200,
    description: 'Employee statistics retrieved successfully',
  })
  async getMyEmployeeStatistics(
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    blockedEmployees: number;
    verifiedEmployees: number;
  }> {
    return await this.hubAdminService.getMyEmployeeStatistics(
      currentUser.userId,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Get my hub admin profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: User,
  })
  async getMyProfile(
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<User> {
    return await this.hubAdminService.getHubAdminProfile(currentUser.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied',
  })
  async findEmployeeById(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<User> {
    return await this.hubAdminService.findEmployeeById(id, currentUser.userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Update employee status (block/unblock)' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee status updated successfully',
  })
  async updateEmployeeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('blocked') blocked: boolean,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<{ msg: string }> {
    return await this.hubAdminService.updateEmployeeStatus(
      id,
      currentUser.userId,
      blocked,
    );
  }

  @Patch(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Update employee permissions' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee permissions updated successfully',
    type: User,
  })
  async updateEmployeePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissions', new ParseArrayPipe({ items: String }))
    permissions: string[],
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<User> {
    return await this.hubAdminService.updateEmployeePermissions(
      id,
      currentUser.userId,
      permissions,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or access denied',
  })
  async deleteEmployee(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<{ msg: string }> {
    return await this.hubAdminService.deleteEmployee(id, currentUser.userId);
  }

  @Patch('bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Bulk update employee status' })
  @ApiResponse({
    status: 200,
    description: 'Employees status updated successfully',
  })
  async bulkUpdateEmployeeStatus(
    @Body('employeeIds', new ParseArrayPipe({ items: Number }))
    employeeIds: number[],
    @Body('blocked') blocked: boolean,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<{ msg: string; updated: number }> {
    return await this.hubAdminService.bulkUpdateEmployeeStatus(
      employeeIds,
      currentUser.userId,
      blocked,
    );
  }

  @Delete('bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees deleted successfully',
  })
  async bulkDeleteEmployees(
    @Body() body: BulkDeleteEmployeesDto,
    @GetCurrentUser() currentUser: UserPayload,
  ): Promise<{ msg: string; deleted: number }> {
    const { employeeIds } = body;
    return await this.hubAdminService.bulkDeleteEmployees(
      employeeIds,
      currentUser.userId,
    );
  }
}
