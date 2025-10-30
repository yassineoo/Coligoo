import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserRole } from 'src/common/types/roles.enum';

import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';

import { OrderTrackingService } from './tracking.service';
import {
  BulkDepositOrdersDto,
  BulkDepositResultDto,
  ScanOrderDto,
  ScanResultDto,
} from './dto/scan.dto';
import UserPayload from 'src/auth/types/user-payload.interface';

@ApiTags('Tracking')
@Controller('tracking')
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: OrderTrackingService) {}

  // Add to orders.controller.ts

  // ===========================
  // HUB SCANNING ENDPOINTS
  // ===========================

  @Post('hub/scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Scan order for deposit',
    description:
      'Scan order by tracking code (orderId) to validate it can be deposited. ' +
      'Only orders with status IN_PREPARATION or CONFIRMED can be deposited.',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan result',
    type: ScanResultDto,
    schema: {
      oneOf: [
        {
          example: {
            success: true,
            message: 'Order found and ready for deposit',
            order: {
              id: 1,
              orderId: 'ORD-2025-001',
              status: 'confirmed',
              firstname: 'Ahmed',
              lastName: 'Benali',
              contactPhone: '0555123456',
              fromCity: 'Alger Centre',
              toCity: 'Oran',
              price: 2500,
              weight: 2.5,
              isStopDesk: false,
              hasExchange: true,
              orderItems: [],
            },
          },
        },
        {
          example: {
            success: false,
            message: 'Order ORD-2025-999 not found',
          },
        },
        {
          example: {
            success: false,
            message:
              'Order ORD-2025-001 has invalid status: delivered. Expected IN_PREPARATION or CONFIRMED',
            order: {
              id: 1,
              orderId: 'ORD-2025-001',
              status: 'delivered',
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Hub staff only' })
  scanOrder(
    @Body() dto: ScanOrderDto,
    @GetCurrentUser() user: UserPayload,
  ): Promise<ScanResultDto> {
    return this.trackingService.scanOrderForDeposit(dto.orderId, user);
  }

  @Post('hub/bulk-deposit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk deposit orders at hub',
    description:
      'Deposit multiple scanned orders at once. Updates status to DEPOSITED_AT_HUB, ' +
      'assigns hub to orders, and creates tracking records.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk deposit result',
    type: BulkDepositResultDto,
    schema: {
      example: {
        successCount: 5,
        failedCount: 1,
        successfulOrders: [1, 2, 3, 4, 5],
        failedOrders: [
          {
            orderId: 6,
            reason:
              'Invalid status: delivered. Expected IN_PREPARATION or CONFIRMED',
          },
        ],
        message: 'Successfully deposited 5 orders, 1 failed',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Hub staff only' })
  @ApiResponse({ status: 400, description: 'Hub user must have city assigned' })
  bulkDepositOrders(
    @Body() dto: BulkDepositOrdersDto,
    @GetCurrentUser() user: UserPayload,
  ): Promise<BulkDepositResultDto> {
    return this.trackingService.bulkDepositOrders(dto, user);
  }
}
