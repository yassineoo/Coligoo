import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminNotificationService } from './admin-notification.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly adminNotificationService: AdminNotificationService,
  ) {}
  /*
  @Get("/admin")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminNotifications(@Query() filterDto: FilterDto) {
    return this.adminNotificationService.getNotifications(filterDto);
  }

  @Get("/user")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, BlockedUserGuard)
  @Roles(Role.CLIENT, Role.ARTISAN)
  getUserNotifications(@Query() filterDto: FilterDto, @GetCurrentUser() userPayload: UserPayload) {
    return this.notificationService.getUserNotifications(filterDto, userPayload.userId);
  }

  @Patch("/user/mark-as-read")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, BlockedUserGuard)
  @Roles(Role.CLIENT, Role.ARTISAN)
  markUserNotificationsAsRead(@GetCurrentUser() userPayload: UserPayload) {
    return this.notificationService.markNotificationsAsRead(userPayload.userId);
  }

  @Get("/user/check-unread")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, BlockedUserGuard)
  @Roles(Role.CLIENT, Role.ARTISAN)
  checkUnreadNotifications(@GetCurrentUser() userPayload: UserPayload) {
    return this.notificationService.checkUnreadNotifications(userPayload.userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createNotification(@Body() createNotifcationDto: CreateNotifcationDto) {
    return this.notificationService.createNotification(createNotifcationDto);
  }

  @Patch("/admin/mark-as-read")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  markAdminNotificationsAsRead() {
    return this.adminNotificationService.markNotificationsAsRead();
  }
    */
}
