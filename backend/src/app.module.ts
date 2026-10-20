import { Module } from '@nestjs/common';
import { BookingsModule } from './bookings/bookings.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [DatabaseModule, SlotsModule, BookingsModule],
  controllers: [HealthController],
})
export class AppModule {}
