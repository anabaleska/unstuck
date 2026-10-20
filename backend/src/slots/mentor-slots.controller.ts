import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { SlotsService } from './slots.service';

/**
 * Mentor-only endpoints. The challenge says "no login", so they're open for now.
 * Keeping them under /mentor means auth can later be added in exactly one place (a guard on this controller).
 */
@Controller('mentor/slots')
export class MentorSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // GET /api/mentor/slots
  @Get()
  findUpcoming() {
    return this.slotsService.findUpcomingForMentor();
  }

  // POST /api/mentor/slots
  @Post()
  create(@Body() dto: CreateSlotDto) {
    return this.slotsService.create(dto);
  }

  // DELETE /api/mentor/slots/:id
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.slotsService.remove(id);
  }
}
