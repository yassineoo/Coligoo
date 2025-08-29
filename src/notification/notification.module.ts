import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AdminNotification } from './entities/admin-notification.entity';
import { AdminNotificationService } from './admin-notification.service';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, AdminNotification, User]),
    UsersModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, AdminNotificationService],
  exports: [NotificationService, AdminNotificationService],
})
export class NotificationModule {}
