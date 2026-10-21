import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AiModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
