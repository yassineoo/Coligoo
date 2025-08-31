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
import { OrderItem } from './entities/order-items';
import { Product } from 'src/products/entities/product.entity';
import { SharedOrdersService } from './shared.service';
import { OrdersOperationsService } from './orders.operations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, OrderTracking,OrderItem,Product]),
    EnvConfigModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderTrackingService,SharedOrdersService,OrdersOperationsService],
})
export class OrdersModule {}
