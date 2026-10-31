-- Login sessions, moved here from Redis: one indexed lookup joined with the
-- user per request (the guard read the user from Postgres anyway), and no
-- Redis command per request, which was most of the free Redis quota.
-- Only a SHA-256 of the cookie value is stored, so a database dump cannot be
-- replayed as a login.
CREATE TABLE sessions (
  id_hash     bytea        PRIMARY KEY CHECK (length(id_hash) = 32),
  user_id     uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  expires_at  timestamptz  NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);
