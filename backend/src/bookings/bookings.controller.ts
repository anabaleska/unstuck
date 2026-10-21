import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // POST /api/bookings
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  // GET /api/bookings/:id  (powers the confirmation page)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findById(id);
  }

  // POST /api/bookings/:id/brief: the AI endpoint. Generates the brief once, then returns the saved one.
  // It's a POST because the first call creates something (and calls Gemini).
  @Post(':id/brief')
  @HttpCode(200)
  async createBrief(@Param('id', ParseUUIDPipe) id: string) {
    const aiBrief = await this.bookingsService.getOrCreateBrief(id);
    return { aiBrief }; // null = AI unavailable; the frontend shows its fallback
  }
}
