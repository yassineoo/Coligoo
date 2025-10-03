// ===========================
// 4. CONTROLLER
// ===========================

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
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CreateShippingFeeDto } from './dto/create-shipping.dto';
import {
  QueryShippingFeeDto,
  SetAllPricesDto,
  UpdateShippingFeeDto,
} from './dto/update-shipping.dto';

// ===========================
// 4. CONTROLLER
// ===========================

@ApiTags('Shipping Fees')
@Controller('shipping-fees')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipping fee for a route' })
  create(@Body() dto: CreateShippingFeeDto) {
    return this.service.create(dto);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize all 3,364 routes (58×58)' })
  initialize() {
    return this.service.initializeAll();
  }

  @Post('set-all')
  @ApiOperation({ summary: 'Update all routes with same prices' })
  setAllPrices(@Body() dto: SetAllPricesDto) {
    return this.service.setAllPrices(dto);
  }

  // ===========================
  // CONTROLLER - New Endpoint
  // ===========================

  @Post('set-wilaya/:code')
  @ApiOperation({ summary: 'Update all routes for specific wilaya (from/to)' })
  @ApiParam({ name: 'code', example: '16', description: 'Wilaya code' })
  setWilayaPrices(@Param('code') code: string, @Body() dto: SetAllPricesDto) {
    return this.service.setWilayaPrices(code, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping fees' })
  @ApiQuery({ name: 'fromWilayaCode', required: false })
  @ApiQuery({ name: 'toWilayaCode', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(@Query() query: QueryShippingFeeDto) {
    return this.service.findAll(query);
  }

  @Get('route/:from/:to')
  @ApiOperation({ summary: 'Get shipping fee for specific route' })
  @ApiParam({ name: 'from', example: '16' })
  @ApiParam({ name: 'to', example: '31' })
  findByRoute(@Param('from') from: string, @Param('to') to: string) {
    return this.service.findByRoute(from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping fee by ID' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping fee' })
  @ApiParam({ name: 'id', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingFeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle active status' })
  @ApiParam({ name: 'id', example: 1 })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shipping fee' })
  @ApiParam({ name: 'id', example: 1 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
