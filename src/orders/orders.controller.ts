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
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BulkDeleteOrdersDto, UpdateOrderDto } from './dto/update-order.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserRole } from 'src/common/types/roles.enum';
import { Order, OrderStatus } from './entities/order.entity';
import {
  AssignDeliverymanDto,
  BulkUpdateOrderDto,
  OrderFilterDto,
  PaginatedResult,
} from './dto/dto';
import { OrdersOperationsService } from './orders.operations.service';
import { HubStatsFilterDto, HubStatsResponseDto } from './dto/stats-filter';
import UserPayload from 'src/auth/types/user-payload.interface';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  HubIncomingOrdersFilterDto,
  HubOutgoingOrdersFilterDto,
  IncomingOrderType,
  OutgoingOrderType,
} from './dto/tabs-filter.dto';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,

    private readonly ordersOperationsService: OrdersOperationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.VENDOR,
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @GetCurrentUser() userPayload: UserPayload,
  ): Promise<Order> {
    return this.ordersOperationsService.create(
      createOrderDto,
      userPayload.userId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.VENDOR,
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Get all orders with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'fromCityId', required: false, type: Number })
  @ApiQuery({ name: 'toCityId', required: false, type: Number })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiQuery({ name: 'deliverymanId', required: false, type: Number })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    example: '2025-12-31',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in order ID, customer name, phone',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.VENDOR,
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Get all orders with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'fromCityId', required: false, type: Number })
  @ApiQuery({ name: 'toCityId', required: false, type: Number })
  @ApiQuery({
    name: 'fromWilayaCode',
    required: false,
    type: String,
    example: '16',
    description: 'Filter by source wilaya code',
  })
  @ApiQuery({
    name: 'toWilayaCode',
    required: false,
    type: String,
    example: '31',
    description: 'Filter by destination wilaya code',
  })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiQuery({ name: 'deliverymanId', required: false, type: Number })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    example: '2025-12-31',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in order ID, customer name, phone',
  })
  @ApiQuery({
    name: 'isStopDesk',
    required: false,
    type: Boolean,
    description: 'Filter by stop desk (pickup at hub)',
  })
  @ApiQuery({
    name: 'hasExchange',
    required: false,
    type: Boolean,
    description: 'Filter orders with exchange',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'status', 'price', 'orderId', 'wilaya'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  findAll(
    @Query() filterDto: OrderFilterDto,
    @Request() req: any,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersService.findAllWithFilters(filterDto, req.user);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get orders for the authenticated vendor' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: "Vendor's orders",
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  getMyOrders(
    @Query() filterDto: OrderFilterDto,
    @Request() req: any,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersService.findVendorOrders(req.user.id, filterDto);
  }

  @Get('my-deliveries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERYMAN)
  @ApiOperation({
    summary: 'Get orders assigned to the authenticated deliveryman',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: "Deliveryman's assigned orders",
  })
  getMyDeliveries(
    @Query() filterDto: OrderFilterDto,
    @Request() req: any,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersService.findDeliverymanOrders(req.user.id, filterDto);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get order analytics and statistics' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Order analytics data',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        totalRevenue: { type: 'number' },
        averageOrderValue: { type: 'number' },
        statusBreakdown: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
        revenueByPeriod: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              revenue: { type: 'number' },
              orderCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  getAnalytics(@Query('period') period: string = 'month', @Request() req: any) {
    return this.ordersService.getOrderAnalytics(period, req.user);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Export orders to CSV/Excel' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'excel'],
    example: 'csv',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Exported file',
    headers: {
      'Content-Disposition': {
        description: 'File attachment header',
        schema: {
          type: 'string',
          example: 'attachment; filename="orders.csv"',
        },
      },
    },
  })
  async exportOrders(
    @Query() filterDto: OrderFilterDto,
    @Query('format') format: string = 'csv',
    @Request() req: any,
  ) {
    return this.ordersService.exportOrders(filterDto, format, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DELIVERYMAN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Order> {
    return this.ordersService.findOneWithPermission(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DELIVERYMAN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Order successfully updated',
    type: Order,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ): Promise<Order> {
    return this.ordersService.updateWithPermission(
      id,
      updateOrderDto,
      req.user,
    );
  }
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DELIVERYMAN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({
    description: 'Order status update',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(OrderStatus),
          example: OrderStatus.CONFIRMED,
          description: 'New status for the order',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: Order,
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus, // Add validation pipe
    @Request() req: any,
  ): Promise<Order> {
    return this.ordersService.updateOrderStatus(id, status, req.user);
  }
  @Patch(':id/assign-deliveryman')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DELIVERYMAN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Assign or reassign deliveryman to order' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Deliveryman assigned successfully',
    type: Order,
  })
  assignDeliveryman(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: AssignDeliverymanDto,
  ): Promise<Order> {
    return this.ordersService.assignDeliveryman(id, assignDto.deliverymanId);
  }

  @Post('bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DELIVERYMAN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Bulk update multiple orders' })
  @ApiResponse({
    status: 200,
    description: 'Orders updated successfully',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateOrderDto) {
    return this.ordersService.bulkUpdateOrders(bulkUpdateDto);
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.VENDOR,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,

    UserRole.DELIVERYMAN,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete orders (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Orders successfully deleted',
  })
  @ApiResponse({
    status: 400,
    description: 'Some orders could not be deleted',
  })
  async bulkDelete(@Body() body: BulkDeleteOrdersDto): Promise<void> {
    await this.ordersService.bulkRemove(body.orderIds);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: Order,
  })
  cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<Order> {
    return this.ordersService.cancelOrder(id, reason, req.user);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking information (Public endpoint)' })
  @ApiParam({ name: 'id', type: 'string', example: 'ORD-2025-001' })
  @ApiResponse({
    status: 200,
    description: 'Order tracking information',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        status: { type: 'string' },
        trackingHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              location: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
        estimatedDelivery: { type: 'string' },
        currentLocation: { type: 'string' },
      },
    },
  })
  trackOrder(@Param('id') orderId: string) {
    return this.ordersService.getTrackingInfo(orderId);
  }

  @Post(':id/delivery-proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERYMAN)
  @ApiOperation({ summary: 'Upload delivery proof (photo, signature)' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Delivery proof uploaded successfully',
  })
  uploadDeliveryProof(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    proofData: { photoUrl?: string; signatureUrl?: string; note?: string },
    @Request() req: any,
  ) {
    return this.ordersService.uploadDeliveryProof(id, proofData, req.user);
  }

  // Add this to your orders.controller.ts

  @Get('statistics/hub')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.HUB_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
    UserRole.VENDOR,
  )
  @ApiOperation({
    summary: 'Get hub statistics',
    description:
      'Get order statistics including total, pending, deferred, delivered, and returned orders',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    example: '2025-01-01',
    description: 'Start date for statistics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    example: '2025-12-31',
    description: 'End date for statistics (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Hub statistics retrieved successfully',
    type: HubStatsResponseDto,
    schema: {
      example: {
        totalOrders: 250,
        pending: 45,
        deferred: 30,
        delivered: 150,
        returned: 25,
        percentages: {
          pending: 18.0,
          deferred: 12.0,
          delivered: 60.0,
          returned: 10.0,
        },
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  getHubStatistics(
    @Query() filterDto: HubStatsFilterDto,
    @Request() req: any,
  ): Promise<HubStatsResponseDto> {
    return this.ordersService.getHubStatistics(filterDto, req.user);
  }

  @Get('hub/incoming')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get incoming orders for hub (3 tabs)',
    description:
      'Get orders arriving TO this hub. Types: active_stores (vendors), manual_entry (hub created), inter_hub (from other hubs)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: IncomingOrderType,
    description: 'Tab filter: active_stores, manual_entry, or inter_hub',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'fromWilayaCode', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Incoming orders retrieved successfully',
  })
  getHubIncomingOrders(
    @Query() filterDto: HubIncomingOrdersFilterDto,
    @GetCurrentUser() user: UserPayload,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersService.getHubIncomingOrders(user, filterDto);
  }

  @Get('hub/outgoing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HUB_ADMIN, UserRole.HUB_EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get outgoing orders for hub (3 tabs)',
    description:
      'Get orders leaving FROM this hub. Types: stop_desk (pickup), delivery (home delivery)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: OutgoingOrderType,
    description: 'Tab filter: stop_desk or delivery',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'toWilayaCode', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Outgoing orders retrieved successfully',
  })
  getHubOutgoingOrders(
    @Query() filterDto: HubOutgoingOrdersFilterDto,
    @GetCurrentUser() user: UserPayload,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersService.getHubOutgoingOrders(user, filterDto);
  }
}
