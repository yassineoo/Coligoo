import { Module } from '@nestjs/common';
import { LockersService } from './lockers.service';
import { LockersController } from './lockers.controller';
import { Locker } from './entities/locker.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { LockerHardwareController } from './locker-hardware.controller';
import { LockerHardwareService } from './locker-hardware.service';

@Module({
  imports: [TypeOrmModule.forFeature([Locker, City]), UsersModule],
  controllers: [LockersController, LockerHardwareController],
  providers: [LockersService, LockerHardwareService],
})
export class LockersModule {}
