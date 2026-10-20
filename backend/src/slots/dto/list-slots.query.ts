import { IsIn, IsOptional } from 'class-validator';
import { SESSION_TYPES, SessionType } from '../../common/session-types';

export class ListSlotsQuery {
  @IsOptional()
  @IsIn(SESSION_TYPES)
  sessionType?: SessionType;
}
