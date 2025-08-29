import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { EnvConfigModule } from 'src/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [EnvConfigModule, TypeOrmModule.forFeature([])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
