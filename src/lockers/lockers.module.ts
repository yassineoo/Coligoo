import { Module } from '@nestjs/common';
import { LockersService } from './lockers.service';
import { LockersController } from './lockers.controller';
import { Locker } from './entities/locker.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Locker, City]), UsersModule],
  controllers: [LockersController],
  providers: [LockersService],
})
export class LockersModule {}
