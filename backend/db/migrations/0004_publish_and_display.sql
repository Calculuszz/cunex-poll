-- Changes for the web app's flow:
--
-- draft ──submit──► pending_review ──approve──► approved ──publish (owner)──► open ──► closed
--   ▲                     │
--   └──── rejected ◄──────┘
--
-- An admin approves; the owner then decides when voting starts ("Publish").
-- (New enum values can't be used in the transaction that adds them, so
-- nothing below refers to 'approved' or 'chula'.)
ALTER TYPE poll_status ADD VALUE 'approved' AFTER 'pending_review';

-- chula = any CUNEX-verified user (ทั้งจุฬาฯ); public also lets Google users in.
ALTER TYPE poll_audience ADD VALUE 'chula' AFTER 'public';

-- Optional reason the owner gives when closing early, shown to voters.
ALTER TABLE polls ADD COLUMN close_reason text CHECK (length(close_reason) <= 500);

-- What voters see of the results, set by the owner after opening:
-- {"published": bool, "elementIds": [uuid] | null, "views": ["list"|"pie"|"bar"],
--  "showCount": bool, "showPercent": bool, "showTotal": bool}
-- NULL = defaults (published, every choice question, list view, all numbers).
ALTER TABLE polls ADD COLUMN result_display jsonb
  CHECK (result_display IS NULL OR jsonb_typeof(result_display) = 'object');

-- Admins are added by student id, so it is now stored (from CUNEX /profile).
-- Ballots still never link to users: voter_key stays an HMAC of the user id.
ALTER TABLE users ADD COLUMN student_id text CHECK (student_id ~ '^\d{10}$');
CREATE INDEX users_student_id_idx ON users (student_id) WHERE student_id IS NOT NULL;

-- Alt text for option images (image elements keep theirs in config).
ALTER TABLE element_options ADD COLUMN image_alt text CHECK (length(image_alt) <= 300);

-- Rejections may now come without a comment.
ALTER TABLE poll_reviews DROP CONSTRAINT poll_reviews_check;

-- Admin takedowns: the owner sees that (and why) their poll was taken down.
ALTER TABLE polls ADD COLUMN taken_down_at timestamptz;
ALTER TABLE polls ADD COLUMN takedown_reason text CHECK (length(takedown_reason) <= 2000);
