import { Module } from '@nestjs/common';
import { PickupPointService } from './pickup-point.service';
import { PickupPointController } from './pickup-point.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/entities/user.entity';
import { PickupPoint } from './entities/pickup-point.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { Hub } from 'src/hub/entities/hub.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PickupPoint, User, City, Hub]),
    UsersModule,
  ],
  controllers: [PickupPointController],
  providers: [PickupPointService],
})
export class PickupPointModule {}
