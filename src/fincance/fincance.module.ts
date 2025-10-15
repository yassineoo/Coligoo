import { Module } from '@nestjs/common';
import { FinanceService } from './fincance.service';
import { FinanceController } from './fincance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { Setting } from 'src/settings/entities/setting.entity';
import { WithdrawalRequest } from './entities/fincance.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawalRequest, User, Order]),
    UsersModule,
    OrdersModule,
  ],

  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FincanceModule {}
