import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EnvConfigModule } from 'src/config/config.module';
import { HubAdminController } from './admin.controller';
import { HubAdminService } from './hub-admin.service';
import { AdminController } from './admin-controller';
import { AdminService } from './admin-service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EnvConfigModule],
  controllers: [UsersController,HubAdminController,AdminController],
  providers: [UsersService ,HubAdminService ,AdminService],
  exports: [UsersService,HubAdminService,AdminService],
})
export class UsersModule {}
