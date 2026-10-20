import { Controller, Get, Query } from '@nestjs/common';
import { ListSlotsQuery } from './dto/list-slots.query';
import { SlotsService } from './slots.service';

/** Public endpoints, used by mentees on the booking page. */
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // GET /api/slots?sessionType=debugging
  @Get()
  findAvailable(@Query() query: ListSlotsQuery) {
    return this.slotsService.findAvailable(query.sessionType);
  }
}
