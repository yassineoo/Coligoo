import { Module } from '@nestjs/common';
import { LockersService } from './lockers.service';
import { LockersController } from './lockers.controller';

@Module({
  controllers: [LockersController],
  providers: [LockersService],
})
export class LockersModule {}
