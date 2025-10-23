// src/lockers/lockers.controller.ts
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
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LockersService } from './lockers.service';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClosetStatus } from './entities/locker.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserRole } from 'src/common/types/roles.enum';
import { CreateLockerDto } from './dto/create-locker.dto';
import { LockerFilterDto } from './dto/filter.dto';
import {
  UpdateClosetStatusDto,
  UpdateLockerDto,
} from './dto/update-locker.dto';

@ApiTags('Lockers')
@Controller('lockers')
export class LockersController {
  constructor(private readonly lockersService: LockersService) {}

  // ===========================
  // STATISTICS
  // ===========================

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.HUB_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get locker statistics',
    description:
      'Get comprehensive statistics about all lockers including capacity and occupancy',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalLockers: 10,
        activeLockers: 9,
        inactiveLockers: 1,
        totalCapacity: 200,
        totalAvailable: 120,
        totalOccupied: 80,
        occupancyRate: 40.0,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  getStatistics() {
    return this.lockersService.getStatistics();
  }

  // ===========================
  // LOCKER CRUD
  // ===========================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new locker',
    description:
      'Create a new locker station with specified capacity. Closets are automatically initialized.',
  })
  @ApiResponse({
    status: 201,
    description: 'Locker created successfully',
    schema: {
      example: {
        id: 1,
        referenceId: 'LOCK-16-1',
        name: 'Downtown Locker Station',
        address: 'حي السلام، شارع الاستقلال',
        cityId: 1,
        capacity: 20,
        closets: [
          { id: 1, status: 'available', currentOrderId: null },
          { id: 2, status: 'available', currentOrderId: null },
        ],
        operatingHours: {
          monday: { open: '08:00', close: '22:00' },
        },
        isActive: true,
        contactPhone: '0123456789',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(@Body() createLockerDto: CreateLockerDto) {
    return this.lockersService.create(createLockerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all lockers with filters',
    description: 'Retrieve paginated list of lockers with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'cityId',
    required: false,
    type: Number,
    description: 'Filter by city ID',
  })
  @ApiQuery({
    name: 'wilayaCode',
    required: false,
    type: String,
    example: '16',
    description: 'Filter by wilaya code',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'hasAvailableClosets',
    required: false,
    type: Boolean,
    description: 'Filter lockers with available closets',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, address, or reference ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    enum: ['name', 'createdAt', 'capacity'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Lockers retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            referenceId: 'LOCK-16-1',
            name: 'Downtown Locker',
            address: 'Address here',
            capacity: 20,
            availableClosets: 15,
            occupiedClosets: 5,
            isFull: false,
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  findAll(@Query() filterDto: LockerFilterDto) {
    return this.lockersService.findAll(filterDto);
  }

  @Get('reference/:referenceId')
  @ApiOperation({
    summary: 'Get locker by reference ID',
    description:
      'Find a locker using its unique reference ID (e.g., LOCK-16-1)',
  })
  @ApiParam({
    name: 'referenceId',
    example: 'LOCK-16-1',
    description: 'Locker reference ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Locker found',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  findByReferenceId(@Param('referenceId') referenceId: string) {
    return this.lockersService.findByReferenceId(referenceId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get locker by ID',
    description: 'Retrieve detailed information about a specific locker',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Locker found',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lockersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update locker',
    description:
      'Update locker details. If capacity changes, closets will be reinitialized. If city changes, reference ID will be regenerated.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Locker updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Locker or City not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLockerDto: UpdateLockerDto,
  ) {
    return this.lockersService.update(id, updateLockerDto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle locker active status',
    description: 'Enable or disable a locker',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.lockersService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete locker',
    description: 'Permanently delete a locker and all its closets',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Locker ID' })
  @ApiResponse({ status: 204, description: 'Locker deleted successfully' })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lockersService.remove(id);
  }

  // ===========================
  // CLOSET MANAGEMENT
  // ===========================

  @Patch(':lockerId/closets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update closet status',
    description:
      'Manually update the status of a specific closet and optionally assign an order',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Closet status updated',
    schema: {
      example: {
        id: 1,
        referenceId: 'LOCK-16-1',
        closets: [
          { id: 1, status: 'occupied', currentOrderId: 123 },
          { id: 2, status: 'available', currentOrderId: null },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Locker or closet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  updateClosetStatus(
    @Param('lockerId', ParseIntPipe) lockerId: number,
    @Body() dto: UpdateClosetStatusDto,
  ) {
    return this.lockersService.updateClosetStatus(lockerId, dto);
  }

  @Post(':lockerId/assign-order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign order to available closet',
    description:
      'Automatically assigns an order to the first available closet in the locker',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiParam({
    name: 'orderId',
    example: 123,
    description: 'Order ID to assign',
  })
  @ApiResponse({
    status: 201,
    description: 'Order assigned to closet successfully',
    schema: {
      example: {
        locker: {
          id: 1,
          referenceId: 'LOCK-16-1',
          name: 'Downtown Locker',
        },
        closetId: 5,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No available closets in this locker',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  assignOrderToCloset(
    @Param('lockerId', ParseIntPipe) lockerId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.lockersService.assignOrderToCloset(lockerId, orderId);
  }

  @Post(':lockerId/closets/:closetId/release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Release closet',
    description:
      'Release a closet after customer picks up their order. Sets status to available and clears order ID.',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiParam({ name: 'closetId', example: 5, description: 'Closet number' })
  @ApiResponse({
    status: 200,
    description: 'Closet released successfully',
  })
  @ApiResponse({ status: 404, description: 'Locker or closet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  releaseCloset(
    @Param('lockerId', ParseIntPipe) lockerId: number,
    @Param('closetId', ParseIntPipe) closetId: number,
  ) {
    return this.lockersService.releaseCloset(lockerId, closetId);
  }

  @Get(':lockerId/closets/available')
  @ApiOperation({
    summary: 'Get available closets in locker',
    description:
      'Returns count and list of all available closets in a specific locker',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Available closets retrieved',
    schema: {
      example: {
        lockerId: 1,
        referenceId: 'LOCK-16-1',
        totalCapacity: 20,
        availableCount: 15,
        availableClosets: [
          { id: 1, status: 'available', currentOrderId: null },
          { id: 3, status: 'available', currentOrderId: null },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async getAvailableClosets(@Param('lockerId', ParseIntPipe) lockerId: number) {
    const locker = await this.lockersService.findOne(lockerId);
    const availableClosets = locker.closets.filter(
      (c) => c.status === ClosetStatus.AVAILABLE,
    );

    return {
      lockerId: locker.id,
      referenceId: locker.referenceId,
      totalCapacity: locker.capacity,
      availableCount: availableClosets.length,
      availableClosets,
    };
  }

  @Get(':lockerId/closets/occupied')
  @ApiOperation({
    summary: 'Get occupied closets in locker',
    description:
      'Returns count and list of all occupied closets with their order IDs',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiResponse({
    status: 200,
    description: 'Occupied closets retrieved',
    schema: {
      example: {
        lockerId: 1,
        referenceId: 'LOCK-16-1',
        totalCapacity: 20,
        occupiedCount: 5,
        occupiedClosets: [
          { id: 2, status: 'occupied', currentOrderId: 123 },
          { id: 4, status: 'occupied', currentOrderId: 456 },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async getOccupiedClosets(@Param('lockerId', ParseIntPipe) lockerId: number) {
    const locker = await this.lockersService.findOne(lockerId);
    const occupiedClosets = locker.closets.filter(
      (c) => c.status === ClosetStatus.OCCUPIED,
    );

    return {
      lockerId: locker.id,
      referenceId: locker.referenceId,
      totalCapacity: locker.capacity,
      occupiedCount: occupiedClosets.length,
      occupiedClosets,
    };
  }

  @Get(':lockerId/closets/:closetId')
  @ApiOperation({
    summary: 'Get specific closet details',
    description:
      'Get details of a specific closet including its current status and order',
  })
  @ApiParam({ name: 'lockerId', example: 1, description: 'Locker ID' })
  @ApiParam({ name: 'closetId', example: 5, description: 'Closet number' })
  @ApiResponse({
    status: 200,
    description: 'Closet details retrieved',
    schema: {
      example: {
        lockerId: 1,
        referenceId: 'LOCK-16-1',
        closet: {
          id: 5,
          status: 'occupied',
          currentOrderId: 123,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Locker or closet not found' })
  async getClosetDetails(
    @Param('lockerId', ParseIntPipe) lockerId: number,
    @Param('closetId', ParseIntPipe) closetId: number,
  ) {
    const locker = await this.lockersService.findOne(lockerId);
    const closet = locker.closets.find((c) => c.id === closetId);

    if (!closet) {
      throw new NotFoundException(
        `Closet ${closetId} not found in locker ${lockerId}`,
      );
    }

    return {
      lockerId: locker.id,
      referenceId: locker.referenceId,
      closet,
    };
  }
}
