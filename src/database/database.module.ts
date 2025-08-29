import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from 'src/auth/entities/otp.entity';
import { EnvConfigModule } from 'src/config/config.module';
import { DatabaseConfig } from 'src/config/database.config';
import { AdminNotification } from 'src/notification/entities/admin-notification.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { Order } from 'src/orders/entities/order.entity';
import { OrderTrackingService } from 'src/orders/tracking.service';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';
import { Or } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvConfigModule],
      useFactory: async (databaseConfig: DatabaseConfig) => ({
        type: databaseConfig.getType(),
        host: databaseConfig.getHost(),
        port: databaseConfig.getPort(),
        username: databaseConfig.getUsername(),
        password: databaseConfig.getPassword(),
        database: databaseConfig.getDatabaseName(),
        synchronize: databaseConfig.getSynchronize(),
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        entities: [
          Wilaya,
          City,
          User,
          Otp,
          Notification,
          AdminNotification,
          Order,
          OrderTrackingService,
          Product
        ],
      }),
      inject: [DatabaseConfig],
    }),
  ],
})
export class DatabaseModule {}
