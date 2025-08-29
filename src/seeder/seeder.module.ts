import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SeederService]
})
export class SeederModule {}
