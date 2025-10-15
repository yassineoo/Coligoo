// src/finance/finance.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/types/roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { FinanceService } from './fincance.service';
import { FinanceStatisticsDto, WithdrawalFilterDto } from './dto/filter.dto';
import { CreateWithdrawalRequestDto } from './dto/create-fincance.dto';
import {
  WithdrawalCondition,
  WithdrawalStatus,
} from './entities/fincance.entity';
import { UpdateWithdrawalRequestDto } from './dto/update-fincance.dto';

@ApiTags('Finance')
@Controller('finance')
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ===========================
  // STATISTICS
  // ===========================

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
  )
  @ApiOperation({
    summary: 'Get daily financial summary',
    description: 'Get comprehensive financial statistics and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: FinanceStatisticsDto,
    schema: {
      example: {
        totalAvailableBalance: 200000,
        totalPaymentToBeMade: 190000,
        totalRemainingBalance: 10000,
        storeRequestForPayment: 5,
        storeReadyForPayment: 8,
        totalPaidOut: 150000,
        totalCompletedPayments: 13,
      },
    },
  })
  getStatistics(@Request() req: any): Promise<FinanceStatisticsDto> {
    return this.financeService.getStatistics(req.user);
  }

  // ===========================
  // WITHDRAWAL REQUESTS CRUD
  // ===========================

  @Post('withdrawal-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
  )
  @ApiOperation({
    summary: 'Create withdrawal request',
    description:
      'Create a new withdrawal request with all eligible paid and returned orders',
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No eligible orders or invalid amount',
  })
  createWithdrawalRequest(
    @Body() dto: CreateWithdrawalRequestDto,
    @Request() req: any,
  ) {
    return this.financeService.createWithdrawalRequest(dto, req.user);
  }

  @Get('withdrawal-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
  )
  @ApiOperation({
    summary: 'Get all withdrawal requests',
    description: 'Get paginated list of withdrawal requests with filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: WithdrawalStatus })
  @ApiQuery({ name: 'condition', required: false, enum: WithdrawalCondition })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal requests retrieved successfully',
  })
  findAll(@Query() filterDto: WithdrawalFilterDto, @Request() req: any) {
    return this.financeService.findAll(filterDto, req.user);
  }

  @Get('withdrawal-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get withdrawal request by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal request found',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findOne(id);
  }

  @Patch('withdrawal-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({
    summary: 'Update withdrawal request',
    description:
      'Update status, condition, payment date, or notes (Admin only)',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal request updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWithdrawalRequestDto,
    @Request() req: any,
  ) {
    return this.financeService.update(id, dto, req.user);
  }

  @Delete('withdrawal-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete withdrawal request',
    description: 'Delete a withdrawal request and unlink orders (Admin only)',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 204, description: 'Request deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.financeService.remove(id, req.user);
  }
}
