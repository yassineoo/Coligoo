// src/shipping/shipping.controller.ts
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateShippingFeeDto } from './dto/create-shipping.dto';
import {
  QueryShippingFeeDto,
  SetAllPricesDto,
  UpdateShippingFeeDto,
} from './dto/update-shipping.dto';
import { ShippingService } from './shipping.service';
import {
  BulkCreateZonesDto,
  CreateShippingZoneDto,
  QueryShippingZoneDto,
  UpdateShippingZoneDto,
} from './dto/zonz-shipping.dto';

@ApiTags('Shipping Fees')
@Controller('shipping-fees')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  // ===========================
  // SHIPPING FEE CRUD
  // ===========================

  @Post()
  @ApiOperation({ summary: 'Create shipping fee for a route' })
  @ApiResponse({ status: 201, description: 'Shipping fee created' })
  @ApiResponse({ status: 404, description: 'Wilaya not found' })
  @ApiResponse({ status: 409, description: 'Route already exists' })
  create(@Body() dto: CreateShippingFeeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping fees (paginated)' })
  @ApiQuery({ name: 'fromWilayaCode', required: false, example: '16' })
  @ApiQuery({ name: 'toWilayaCode', required: false, example: '31' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Query() query: QueryShippingFeeDto) {
    return this.service.findAll(query);
  }

  @Get('route/:from/:to')
  @ApiOperation({ summary: 'Get shipping fee for specific route' })
  @ApiParam({ name: 'from', example: '16', description: 'From wilaya code' })
  @ApiParam({ name: 'to', example: '31', description: 'To wilaya code' })
  @ApiResponse({ status: 200, description: 'Shipping fee found' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  findByRoute(@Param('from') from: string, @Param('to') to: string) {
    return this.service.findByRoute(from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping fee by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Shipping fee ID' })
  @ApiResponse({ status: 200, description: 'Shipping fee found' })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update shipping fee with optional zones',
    description:
      'Update shipping fee prices and optionally update/create/delete zones in one request. ' +
      'Zones with ID will be updated, zones without ID will be created, and zones not in the array will be deleted.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Shipping fee ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping fee updated successfully with zones',
  })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate cities' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingFeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle shipping fee active status' })
  @ApiParam({ name: 'id', example: 1, description: 'Shipping fee ID' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shipping fee' })
  @ApiParam({ name: 'id', example: 1, description: 'Shipping fee ID' })
  @ApiResponse({ status: 204, description: 'Shipping fee deleted' })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ===========================
  // BULK OPERATIONS
  // ===========================

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize all 3,364 routes (58×58)',
    description: 'Creates shipping fees for all possible wilaya combinations',
  })
  @ApiResponse({
    status: 201,
    description: 'Routes initialized',
    schema: {
      example: { created: 3364, skipped: 0 },
    },
  })
  initialize() {
    return this.service.initializeAll();
  }

  @Post('set-all')
  @ApiOperation({
    summary: 'Update all routes with same prices',
    description: 'Updates or creates all routes with the provided prices',
  })
  @ApiResponse({
    status: 200,
    description: 'All routes updated',
    schema: {
      example: { updated: 3000, created: 364 },
    },
  })
  setAllPrices(@Body() dto: SetAllPricesDto) {
    return this.service.setAllPrices(dto);
  }

  @Post('set-wilaya/:code')
  @ApiOperation({
    summary: 'Update all routes for specific wilaya (from/to)',
    description:
      'Updates all routes where the wilaya is either source or destination',
  })
  @ApiParam({ name: 'code', example: '16', description: 'Wilaya code' })
  @ApiResponse({
    status: 200,
    description: 'Wilaya routes updated',
    schema: {
      example: { updated: 100, created: 16 },
    },
  })
  setWilayaPrices(@Param('code') code: string, @Body() dto: SetAllPricesDto) {
    return this.service.setWilayaPrices(code, dto);
  }

  // ===========================
  // ZONE MANAGEMENT
  // ===========================

  @Post('zones')
  @ApiOperation({
    summary: 'Create a shipping zone',
    description:
      'Creates a new zone with specific cities and price for a shipping route',
  })
  @ApiResponse({ status: 201, description: 'Zone created successfully' })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  @ApiResponse({ status: 400, description: 'Invalid city IDs' })
  @ApiResponse({
    status: 409,
    description: 'Cities already assigned to another zone',
  })
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.service.createZone(dto);
  }

  @Post('zones/bulk')
  @ApiOperation({
    summary: 'Bulk create multiple zones for a route',
    description: 'Creates multiple zones at once for a shipping fee',
  })
  @ApiResponse({ status: 201, description: 'Zones created successfully' })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or duplicate cities',
  })
  bulkCreateZones(@Body() dto: BulkCreateZonesDto) {
    return this.service.bulkCreateZones(dto);
  }

  @Post('zones/generate/:from/:to')
  @ApiOperation({
    summary: 'Auto-generate 3 random zones for a route',
    description:
      'Automatically splits destination wilaya communes into 3 random zones with progressive pricing (base, +17%, +33%)',
  })
  @ApiParam({ name: 'from', example: '16', description: 'From wilaya code' })
  @ApiParam({
    name: 'to',
    example: '09',
    description: 'To wilaya code (e.g., Blida)',
  })
  @ApiResponse({
    status: 201,
    description: '3 zones created successfully',
  })
  @ApiResponse({ status: 404, description: 'Shipping fee not found' })
  @ApiResponse({ status: 409, description: 'Zones already exist for route' })
  generateRandomZones(@Param('from') from: string, @Param('to') to: string) {
    return this.service.generateRandomZones(from, to);
  }

  @Get('zones/all')
  @ApiOperation({
    summary: 'Get all shipping zones',
    description: 'Returns all zones with optional filters',
  })
  @ApiQuery({
    name: 'shippingFeeId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Zones retrieved successfully' })
  findAllZones(@Query() query: QueryShippingZoneDto) {
    return this.service.findAllZones(query);
  }

  @Get('zones/route/:from/:to')
  @ApiOperation({
    summary: 'Get all zones for a specific route',
    description: 'Returns all zones for a shipping route between two wilayas',
  })
  @ApiParam({ name: 'from', example: '16', description: 'From wilaya code' })
  @ApiParam({ name: 'to', example: '31', description: 'To wilaya code' })
  @ApiResponse({ status: 200, description: 'Zones found' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  findZonesByRoute(@Param('from') from: string, @Param('to') to: string) {
    return this.service.findZonesByRoute(from, to);
  }

  @Get('zones/:id')
  @ApiOperation({ summary: 'Get zone by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Zone ID' })
  @ApiResponse({ status: 200, description: 'Zone found' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  findOneZone(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneZone(id);
  }

  @Patch('zones/:id')
  @ApiOperation({
    summary: 'Update a shipping zone by ID',
    description:
      'Update zone name, price, cities, or active status. Cities cannot overlap with other zones in the same route.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Zone ID' })
  @ApiResponse({ status: 200, description: 'Zone updated successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  @ApiResponse({ status: 400, description: 'Invalid city IDs' })
  @ApiResponse({
    status: 409,
    description: 'Cities already assigned to another zone',
  })
  updateZone(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingZoneDto,
  ) {
    return this.service.updateZoneById(id, dto);
  }

  @Patch('zones/:id/toggle')
  @ApiOperation({ summary: 'Toggle zone active status' })
  @ApiParam({ name: 'id', example: 1, description: 'Zone ID' })
  @ApiResponse({ status: 200, description: 'Zone status toggled' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  toggleZoneActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleZoneActive(id);
  }

  @Delete('zones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shipping zone' })
  @ApiParam({ name: 'id', example: 1, description: 'Zone ID' })
  @ApiResponse({ status: 204, description: 'Zone deleted successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  removeZone(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeZone(id);
  }

  // ===========================
  // PRICE CALCULATION
  // ===========================

  @Get('price/:from/:to')
  @ApiOperation({
    summary: 'Calculate shipping price',
    description:
      'Get the price for a specific route, delivery type, and optional city',
  })
  @ApiParam({ name: 'from', example: '16', description: 'From wilaya code' })
  @ApiParam({ name: 'to', example: '31', description: 'To wilaya code' })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['desktop', 'home', 'return'],
    example: 'home',
  })
  @ApiQuery({
    name: 'cityId',
    required: false,
    type: Number,
    example: 1,
    description: 'City ID for zone-based pricing',
  })
  @ApiResponse({
    status: 200,
    description: 'Price calculated',
    schema: { example: 650 },
  })
  @ApiResponse({ status: 404, description: 'Route not found' })
  getPrice(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('type') type: 'desktop' | 'home' | 'return',
    @Query('cityId', new ParseIntPipe({ optional: true })) cityId?: number,
  ) {
    return this.service.getPrice(from, to, type, cityId);
  }

  @Get('price-details/:from/:to')
  @ApiOperation({
    summary: 'Get detailed pricing information',
    description:
      'Returns all prices (desktop, home, return) and zone info if applicable',
  })
  @ApiParam({ name: 'from', example: '16', description: 'From wilaya code' })
  @ApiParam({ name: 'to', example: '31', description: 'To wilaya code' })
  @ApiQuery({
    name: 'cityId',
    required: false,
    type: Number,
    example: 1,
    description: 'City ID to check for zone pricing',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed pricing information',
    schema: {
      example: {
        desktopPrice: 450,
        homePrice: 650,
        returnPrice: 500,
        zoneName: 'Zone Centre',
        zoneId: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Route not found' })
  getPriceDetails(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('cityId', new ParseIntPipe({ optional: true })) cityId?: number,
  ) {
    return this.service.getPriceDetails(from, to, cityId);
  }
}
