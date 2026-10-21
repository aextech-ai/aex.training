-- AEX ID sequence
-- Note: integer aex_id is launch-appropriate.
-- Future migration required to AEX_ID base58 short form (Ergon Protocol v2.1)
-- before aex_id appears in any external-facing permanent format (URLs, exports, certificates)
CREATE SEQUENCE IF NOT EXISTS aex_id_seq START 10000;

-- Users
CREATE TABLE IF NOT EXISTS users (
  aex_id        INTEGER PRIMARY KEY DEFAULT nextval('aex_id_seq'),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- null for provisional records (no password yet)
  status        TEXT NOT NULL DEFAULT 'provisional', -- provisional | active
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id            SERIAL PRIMARY KEY,
  aex_id        INTEGER NOT NULL REFERENCES users(aex_id),
  course        TEXT NOT NULL,           -- 'ariadne' | 'joan' | 'bartlett'
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,            -- NULL until course completion
                                        -- Hook for future AEXgora DEX credential issuance
                                        -- Do not remove this column; wire issuance logic here in a future package
  UNIQUE(aex_id, course)
);

-- Access codes (pre-Stripe enrollment path)
-- TODO Package 5: add rate limiting to /api/redeem before Stripe goes live
CREATE TABLE IF NOT EXISTS access_codes (
  code          TEXT PRIMARY KEY,
  course        TEXT NOT NULL,
  redeemed_by   INTEGER REFERENCES users(aex_id),
  redeemed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation persistence (carry-forwards)
CREATE TABLE IF NOT EXISTS conversations (
  aex_id      INTEGER NOT NULL REFERENCES users(aex_id),
  course      TEXT NOT NULL,
  messages    JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (aex_id, course)
);

-- Stripe purchase records (idempotency + audit trail)
CREATE TABLE IF NOT EXISTS purchases (
  id                SERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  email             TEXT NOT NULL,
  course            TEXT NOT NULL,
  aex_id            INTEGER REFERENCES users(aex_id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Free persona turns, per visitor per UTC day (Barry's Greatest Misses; lib/db/free-turns.ts).
-- bucket is sha256(salt|day|ip): no IP is stored. Rows older than a few days can be deleted.
CREATE TABLE IF NOT EXISTS free_turns (
  course  TEXT NOT NULL,
  bucket  TEXT NOT NULL,
  day     DATE NOT NULL,
  turns   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (course, bucket, day)
);
