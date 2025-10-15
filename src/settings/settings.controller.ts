// src/settings/settings.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  UpdateSettingsDto,
  SettingsResponseDto,
} from './dto/update-setting.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserRole } from 'src/common/types/roles.enum';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===========================
  // ADMIN SETTINGS ENDPOINTS
  // ===========================

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get system settings',
    description: 'Get weight and volume configuration settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: SettingsResponseDto,
    schema: {
      example: {
        id: 1,
        freeWeightLimit: 10,
        weightPricePerKg: 50,
        maxWeightLimit: 100,
        freeVolumeLimit: 50000,
        volumePricePerCm3: 0.001,
        maxVolumeLimit: 500000,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T12:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update system settings',
    description: 'Update weight and volume configuration settings (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: SettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }
}
