import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { WilayaService } from './wilaya.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Wilaya')
@Controller('wilaya')
@UseInterceptors(CacheInterceptor)
export class WilayaController {
  constructor(private readonly wilayaService: WilayaService) {}

  @Get('/')
  async getAllWilayas() {
    return await this.wilayaService.getAll();
  }

  @Get('/:code/cities')
  async getWilayaCities(@Param('code') code: string) {
    return await this.wilayaService.getWilayaCities(code);
  }
  @Get('/cities')
  @ApiQuery({
    name: 'code',
    type: String,
    required: true,
    description: 'Wilaya code',
  })
  async getWilayaCitiesCode(@Query('code') code: string) {
    return await this.wilayaService.getWilayaCities(code);
  }
}
