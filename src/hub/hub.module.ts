import { Module } from '@nestjs/common';
import { HubService } from './hub.service';
import { HubController } from './hub.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hub } from './entities/hub.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hub, User]), UsersModule],
  controllers: [HubController],
  providers: [HubService],
})
export class HubModule {}
