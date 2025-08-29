import { Module } from '@nestjs/common';
import { WilayaService } from './wilaya.service';
import { WilayaController } from './wilaya.controller';

@Module({
  controllers: [WilayaController],
  providers: [WilayaService]
})
export class WilayaModule {}
