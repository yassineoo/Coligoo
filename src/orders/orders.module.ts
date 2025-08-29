import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvConfigModule } from 'src/config/config.module';
import { User } from 'src/users/entities/user.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { OrderTrackingService } from './tracking.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, OrderTracking]),
    EnvConfigModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderTrackingService],
})
export class OrdersModule {}
