import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingFee } from './entities/shipping.entity';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingFee, Wilaya])],
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}
