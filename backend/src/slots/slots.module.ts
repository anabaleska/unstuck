import { Module } from '@nestjs/common';
import { MentorSlotsController } from './mentor-slots.controller';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  controllers: [SlotsController, MentorSlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
