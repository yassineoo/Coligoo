// hub/hub.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HubService } from './hub.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { QueryHubDto } from './dto/hub-filters.dto';

@ApiTags('Hubs')
@Controller('hubs')
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hub with admin user' })
  @ApiResponse({ status: 201, description: 'Hub created successfully' })
  create(@Body() createHubDto: CreateHubDto) {
    return this.hubService.create(createHubDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hubs' })
  findAll(@Query() queryDto: QueryHubDto) {
    return this.hubService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hub by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hubService.findOne(id);
  }

  @Get('admin/:adminUserId')
  @ApiOperation({ summary: 'Get hub by admin user ID' })
  findByAdmin(@Param('adminUserId', ParseIntPipe) adminUserId: number) {
    return this.hubService.findByAdminUserId(adminUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hub and admin data' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHubDto: UpdateHubDto,
  ) {
    return this.hubService.update(id, updateHubDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hub and admin user' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hubService.remove(id);
  }
}
