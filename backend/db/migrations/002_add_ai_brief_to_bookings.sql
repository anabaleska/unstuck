-- AI-generated session brief, stored once per booking.
-- NULL means "not generated yet" (or the AI was unavailable).
ALTER TABLE bookings ADD COLUMN ai_brief JSONB;
