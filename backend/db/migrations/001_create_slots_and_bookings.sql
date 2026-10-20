-- Slots: time windows the mentor publishes.
CREATE TABLE slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('code_review', 'debugging', 'career_chat')),
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (ends_at > starts_at),

  -- The mentor can't be in two places at once: the database rejects any slot
  -- whose time range overlaps (&&) an existing slot's range.
  CONSTRAINT slots_no_overlap EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
);

CREATE INDEX slots_starts_at_idx ON slots (starts_at);

-- Bookings: a mentee claiming a slot.
CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- UNIQUE = at most one booking per slot. This is what makes double booking
  -- impossible, even when two requests arrive at the exact same moment.
  slot_id      UUID NOT NULL UNIQUE REFERENCES slots(id) ON DELETE RESTRICT,

  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  topic        TEXT NOT NULL,
  resource_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
