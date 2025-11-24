// src/lockers/locker-hardware.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  LockerHardwareService,
  OpenDepositDto,
  CloseDepositDto,
  OpenWithdrawDto,
  CloseWithdrawDto,
} from './locker-hardware.service';

@ApiTags('Locker Hardware')
@Controller('locker-hardware')
export class LockerHardwareController {
  constructor(private readonly lockerHardwareService: LockerHardwareService) {}

  @Post('open-deposit')
  @ApiOperation({ summary: 'Step 1: Open closet door for package deposit' })
  @ApiResponse({
    status: 200,
    description: 'Closet door opened successfully',
  })
  async openDeposit(@Body() dto: OpenDepositDto): Promise<any> {
    return this.lockerHardwareService.openDeposit(dto);
  }

  @Post('close-deposit')
  @ApiOperation({
    summary: 'Step 2: Close deposit door and generate password',
  })
  @ApiResponse({
    status: 200,
    description: 'Package deposited, password generated',
  })
  async closeDeposit(@Body() dto: CloseDepositDto): Promise<any> {
    return this.lockerHardwareService.closeDeposit(dto);
  }

  @Post('open-withdraw')
  @ApiOperation({
    summary: 'Step 3: Customer enters password to open closet',
  })
  @ApiResponse({
    status: 200,
    description: 'Closet opened for package retrieval',
  })
  async openWithdraw(@Body() dto: OpenWithdrawDto): Promise<any> {
    return this.lockerHardwareService.openWithdraw(dto);
  }

  @Post('close-withdraw')
  @ApiOperation({
    summary: 'Step 4: Customer retrieved package and closed door',
  })
  @ApiResponse({ status: 200, description: 'Closet freed successfully' })
  async closeWithdraw(@Body() dto: CloseWithdrawDto): Promise<any> {
    return this.lockerHardwareService.closeWithdraw(dto);
  }
}
