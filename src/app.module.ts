import { Module, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { EnvConfigModule } from './config/config.module';
import { WilayaModule } from './wilaya/wilaya.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { PaymentModule } from './payment/payment.module';
import { ImagesModule } from './images/images.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SeederService } from './seeder/seeder.service';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    EnvConfigModule,
    WilayaModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    PaymentModule,
    ImagesModule,
    StatisticsModule,
    NotificationModule,
    SearchModule,
    CacheModule.register({ isGlobal: true, ttl: 15000 }),
    SearchModule,
    OrdersModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [AppService, SeederService],
})
export class AppModule implements OnModuleInit {
  // Implement OnModuleInit
  constructor(private readonly seederService: SeederService) {} // Inject SeederService

  async onModuleInit() {
    // IMPORTANT: Only run in development to avoid accidental re-seeding in production
    // Ensure you have a NODE_ENV environment variable set (e.g., in your .env file or build process)
    // For example, in your .env: NODE_ENV=development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Detected development environment. Starting database seeding...',
      );
      try {
        await this.seederService.seed();
        console.log('Database seeding complete!');
      } catch (error) {
        console.error('Database seeding failed:', error);
        // You might want to throw the error to prevent the app from starting with bad data,
        // or just log it depending on your requirements.
        // throw error;
      }
    } else {
      console.log(`NODE_ENV is ${process.env.NODE_ENV}. Seeding skipped.`);
    }
  }
}
