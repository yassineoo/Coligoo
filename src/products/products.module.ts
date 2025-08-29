import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from './entities/product.entity';
import { EnvConfigModule } from 'src/config/config.module';
import { ProductsService } from './products.service';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
      TypeOrmModule.forFeature([User, Order, Product]),
      EnvConfigModule,
      UsersModule
    ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
//ProductsService