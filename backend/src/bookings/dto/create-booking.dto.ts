import { IsEmail, IsNotEmpty, IsOptional, IsUrl, IsUUID, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim } from '../../common/trim.transform';

export class CreateBookingDto {
  @IsUUID()
  slotId: string;

  @Trim()
  @IsNotEmpty({ message: 'Please tell us your name.' })
  @MaxLength(100)
  name: string;

  @Trim()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(254)
  email: string;

  // "What are you stuck on?" is required: it's the whole point of Unstuck.
  @Trim()
  @Length(10, 1000, { message: 'Describe what you need help with in 10 to 1000 characters.' })
  topic: string;

  // Optional link to a PR, repo, or gist. An empty field is treated as "not provided".
  @Transform(({ value }) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined))
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { message: 'Link must start with http:// or https://' })
  @MaxLength(500)
  resourceUrl?: string;
}
