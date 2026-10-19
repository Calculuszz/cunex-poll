-- CUNEX Poll — database schema
-- Target: PostgreSQL 16+ (uses NULLS NOT DISTINCT, gen_random_uuid())

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE user_role      AS ENUM ('user', 'admin');
CREATE TYPE auth_provider  AS ENUM ('cunex', 'google', 'email');

-- public     = anyone logged in (incl. Google/Email users)
-- restricted = only CUNEX-verified users matching poll_audience_rules
CREATE TYPE poll_audience  AS ENUM ('public', 'restricted');

-- draft ──submit──► pending_review ──approve──► open ──(closes_at / manual)──► closed
--   ▲                     │
--   └──── rejected ◄──────┘   (rejected is editable and can be resubmitted)
CREATE TYPE poll_status    AS ENUM ('draft', 'pending_review', 'rejected', 'open', 'closed');

CREATE TYPE element_type   AS ENUM (
  -- questions
  'text_question',     -- ข้อความ
  'single_choice',     -- เลือกหนึ่งข้อ (radio)
  'multi_choice',      -- เลือกหลายข้อ (checkbox)
  'dropdown',          -- เลือกรายการ
  -- content elements
  'description',       -- คำอธิบาย
  'image',             -- รูปภาพ
  'info_popup',        -- ป๊อปอัปข้อมูล
  'accordion',         -- หัวข้อพับเก็บ
  'page_break'         -- ขึ้นหน้าใหม่
);

CREATE TYPE review_decision AS ENUM ('approved', 'rejected');
CREATE TYPE image_status    AS ENUM ('pending', 'ready', 'failed');

-- ============================================================
-- Reference data
-- ============================================================

-- Upserted from CUNEX /profile on every login (facultyCode, facultyNameTH/EN).
CREATE TABLE faculties (
  code        char(2)     PRIMARY KEY,
  name_th     text        NOT NULL,
  name_en     text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Users & identities
-- ============================================================

-- PII is kept to the minimum CUNEX gives us. studentId is NOT stored:
-- nothing needs it, and faculty/year are enough for audience checks.
CREATE TABLE users (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  role               user_role   NOT NULL DEFAULT 'user',
  -- true only when the user has logged in via CUNEX at least once;
  -- restricted polls require it.
  is_chula_verified  boolean     NOT NULL DEFAULT false,
  faculty_code       char(2)     REFERENCES faculties(code),
  student_year       smallint    CHECK (student_year BETWEEN 2400 AND 2700),  -- ปีเข้า พ.ศ.
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_login_at      timestamptz,
  CHECK (is_chula_verified OR (faculty_code IS NULL AND student_year IS NULL))
);

-- One row per login method. provider_subject is:
--   cunex  → CUNEX userId (String(20))
--   google → OIDC "sub"
--   email  → lower-cased email address
CREATE TABLE user_identities (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          auth_provider NOT NULL,
  provider_subject  text          NOT NULL,
  email             text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);
CREATE INDEX user_identities_user_idx ON user_identities (user_id);

-- Sessions and email OTPs live in Redis (TTL-based), not here.

-- ============================================================
-- Images (uploaded or ingested from an external URL by the worker)
-- ============================================================

CREATE TABLE images (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid         NOT NULL REFERENCES users(id),
  status       image_status NOT NULL DEFAULT 'pending',
  storage_key  text         UNIQUE,            -- set once stored in object storage
  source_url   text,                           -- original URL if ingested; never served to clients
  mime_type    text,
  byte_size    integer,
  width        integer,
  height       integer,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  CHECK (status <> 'ready' OR storage_key IS NOT NULL)
);

-- ============================================================
-- Polls
-- ============================================================

CREATE TABLE polls (
  id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id               uuid          NOT NULL REFERENCES users(id),
  status                 poll_status   NOT NULL DEFAULT 'draft',
  audience               poll_audience NOT NULL DEFAULT 'public',

  title                  text          NOT NULL DEFAULT '' CHECK (length(title) <= 200),
  description            text          NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
  cover_image_id         uuid          REFERENCES images(id),
  closes_at              timestamptz,  -- เวลาปิดโหวต; the only field editable after approval

  -- settings (toggles at the bottom of the editor)
  show_results_realtime  boolean       NOT NULL DEFAULT false, -- off → voters see results after close
  allow_answer_edit      boolean       NOT NULL DEFAULT false, -- "ลงคะแนนซ้ำ" = edit own answer
  listed_publicly        boolean       NOT NULL DEFAULT false, -- "เผยแพร่ในหน้ารวม"

  share_url              text,         -- CUNEX UniversalLink, created when opened

  submitted_at           timestamptz,
  opened_at              timestamptz,
  closed_at              timestamptz,
  created_at             timestamptz   NOT NULL DEFAULT now(),
  updated_at             timestamptz   NOT NULL DEFAULT now(),
  deleted_at             timestamptz,  -- soft delete

  CHECK (status IN ('draft', 'rejected') OR (length(title) > 0 AND closes_at IS NOT NULL)),
  CHECK (status NOT IN ('open', 'closed') OR opened_at IS NOT NULL),
  CHECK (status <> 'closed' OR closed_at IS NOT NULL)
);
CREATE INDEX polls_owner_idx        ON polls (owner_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX polls_review_queue_idx ON polls (submitted_at) WHERE status = 'pending_review' AND deleted_at IS NULL;
CREATE INDEX polls_public_feed_idx  ON polls (opened_at DESC)
  WHERE status = 'open' AND listed_publicly AND deleted_at IS NULL;
-- worker: find polls to auto-close
CREATE INDEX polls_to_close_idx     ON polls (closes_at) WHERE status = 'open';

-- Who may answer a restricted poll. Rows are OR-ed; inside a row, set columns are AND-ed.
--   (faculty '21', year NULL)  → all of Engineering
--   (faculty '21', year 2567)  → Engineering, entry year 2567
--   (faculty NULL, year 2567)  → everyone with entry year 2567
CREATE TABLE poll_audience_rules (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id       uuid      NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  faculty_code  char(2)   REFERENCES faculties(code),
  student_year  smallint  CHECK (student_year BETWEEN 2400 AND 2700),
  CHECK (faculty_code IS NOT NULL OR student_year IS NOT NULL),
  UNIQUE NULLS NOT DISTINCT (poll_id, faculty_code, student_year)
);

CREATE TABLE poll_reviews (
  id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid            NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  reviewer_id  uuid            NOT NULL REFERENCES users(id),
  decision     review_decision NOT NULL,
  comment      text            CHECK (length(comment) <= 2000),
  created_at   timestamptz     NOT NULL DEFAULT now(),
  CHECK (decision = 'approved' OR comment IS NOT NULL)   -- rejections must say why
);
CREATE INDEX poll_reviews_poll_idx ON poll_reviews (poll_id, created_at DESC);

-- ============================================================
-- Poll content (questions + content elements)
-- ============================================================

-- config shape per type (validated in the API, see docs):
--   text_question  {"placeholder": str, "max_length": int}
--   single_choice  {"layout": "list"|"grid"}
--   multi_choice   {"layout": "list"|"grid", "min_select": int?, "max_select": int?}
--   dropdown       {}
--   description    {"show_heading": bool, "sections": [{"heading": str, "body": str}]}
--   image          {"image_id": uuid, "caption": str?}
--   info_popup     {"button_text": str, "title": str, "body": str}
--   accordion      {"title": str, "body": str}
--   page_break     {}
CREATE TABLE poll_elements (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid         NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  position     integer      NOT NULL CHECK (position >= 0),
  type         element_type NOT NULL,
  title        text         NOT NULL DEFAULT '' CHECK (length(title) <= 500),  -- คำถาม / heading
  is_required  boolean      NOT NULL DEFAULT false,                            -- ต้องตอบ
  config       jsonb        NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  CHECK (NOT is_required OR type IN ('text_question', 'single_choice', 'multi_choice', 'dropdown')),
  -- deferrable so a reorder ("swipe") can swap positions inside one transaction
  CONSTRAINT poll_elements_position_uq UNIQUE (poll_id, position) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (poll_id, id)   -- target for composite FKs below
);

-- Choices for single_choice / multi_choice / dropdown.
-- popup = {"button_text": str, "title": str, "body": str} (ป๊อปอัปข้อมูลของตัวเลือก)
CREATE TABLE element_options (
  id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id   uuid     NOT NULL REFERENCES poll_elements(id) ON DELETE CASCADE,
  position     integer  NOT NULL CHECK (position >= 0),
  label        text     NOT NULL CHECK (length(label) BETWEEN 1 AND 300),
  description  text     CHECK (length(description) <= 1000),
  image_id     uuid     REFERENCES images(id),
  popup        jsonb    CHECK (popup IS NULL OR jsonb_typeof(popup) = 'object'),
  CONSTRAINT element_options_position_uq UNIQUE (element_id, position) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (element_id, id)
);

-- Structure is locked once a poll leaves draft/rejected (decision: only closes_at is
-- editable after approval). Enforced here as well as in the API, so no code path can
-- change questions under existing ballots.
CREATE FUNCTION assert_poll_editable(p_poll_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE s poll_status;
BEGIN
  SELECT status INTO s FROM polls WHERE id = p_poll_id;
  IF s IS NOT NULL AND s NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'poll % is locked (status=%)', p_poll_id, s USING ERRCODE = 'check_violation';
  END IF;
END $$;

CREATE FUNCTION trg_poll_elements_lock() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_poll_editable(COALESCE(NEW.poll_id, OLD.poll_id));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE FUNCTION trg_element_options_lock() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_poll_editable(
    (SELECT poll_id FROM poll_elements WHERE id = COALESCE(NEW.element_id, OLD.element_id)));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER poll_elements_lock
  BEFORE INSERT OR UPDATE OR DELETE ON poll_elements
  FOR EACH ROW EXECUTE FUNCTION trg_poll_elements_lock();
CREATE TRIGGER element_options_lock
  BEFORE INSERT OR UPDATE OR DELETE ON element_options
  FOR EACH ROW EXECUTE FUNCTION trg_element_options_lock();
CREATE TRIGGER poll_audience_rules_lock
  BEFORE INSERT OR UPDATE OR DELETE ON poll_audience_rules
  FOR EACH ROW EXECUTE FUNCTION trg_poll_elements_lock();

-- ============================================================
-- Ballots (anonymous to the poll owner)
-- ============================================================
-- No user_id anywhere in this section.
-- voter_key = HMAC-SHA256(pepper, poll_id || user_id), pepper lives in the secret
-- manager, never in the DB. One ballot per voter per poll; editing an answer
-- (allow_answer_edit) replaces the ballot's children in one transaction.
-- faculty_code / student_year are snapshots at vote time, used for breakdowns
-- (API hides any group smaller than the k-anonymity threshold).
CREATE TABLE ballots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id       uuid        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_key     bytea       NOT NULL CHECK (length(voter_key) = 32),
  faculty_code  char(2)     REFERENCES faculties(code),
  student_year  smallint,
  -- truncated to the minute to blunt timing correlation with login logs
  submitted_at  timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  UNIQUE (poll_id, voter_key),
  UNIQUE (poll_id, id)
);

-- Selected options (single_choice / multi_choice / dropdown).
-- Composite FKs guarantee option ∈ element ∈ same poll as the ballot.
CREATE TABLE ballot_choices (
  ballot_id   uuid NOT NULL,
  poll_id     uuid NOT NULL,
  element_id  uuid NOT NULL,
  option_id   uuid NOT NULL,
  PRIMARY KEY (ballot_id, option_id),
  FOREIGN KEY (poll_id, ballot_id)     REFERENCES ballots (poll_id, id) ON DELETE CASCADE,
  FOREIGN KEY (poll_id, element_id)    REFERENCES poll_elements (poll_id, id),
  FOREIGN KEY (element_id, option_id)  REFERENCES element_options (element_id, id)
);
-- result tally: SELECT option_id, count(*) ... WHERE poll_id = $1 GROUP BY option_id
CREATE INDEX ballot_choices_tally_idx ON ballot_choices (poll_id, option_id);

CREATE TABLE ballot_text_answers (
  ballot_id   uuid NOT NULL,
  poll_id     uuid NOT NULL,
  element_id  uuid NOT NULL,
  answer      text NOT NULL CHECK (length(answer) BETWEEN 1 AND 5000),
  PRIMARY KEY (ballot_id, element_id),
  FOREIGN KEY (poll_id, ballot_id)   REFERENCES ballots (poll_id, id) ON DELETE CASCADE,
  FOREIGN KEY (poll_id, element_id)  REFERENCES poll_elements (poll_id, id)
);
CREATE INDEX ballot_text_answers_element_idx ON ballot_text_answers (poll_id, element_id);

-- ============================================================
-- Notifications (CUNEX notification API, sent by the worker)
-- ============================================================
-- Batch-level only: per-recipient rows aren't needed and would grow fast.
CREATE TABLE notification_batches (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id        uuid        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  kind           text        NOT NULL CHECK (kind IN ('poll_opened', 'poll_closing_soon', 'poll_result')),
  total          integer     NOT NULL DEFAULT 0,
  succeeded      integer     NOT NULL DEFAULT 0,
  failed         integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  UNIQUE (poll_id, kind)    -- never notify the same event twice
);

-- ============================================================
-- Audit log (admin + poll lifecycle actions)
-- ============================================================
-- MUST NOT record voting actions: a (user, poll, time) row here would undo ballot anonymity.
CREATE TABLE audit_logs (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     uuid        REFERENCES users(id),     -- NULL = system/worker
  action       text        NOT NULL,                 -- e.g. poll.submit, poll.approve, user.grant_admin
  entity_type  text        NOT NULL,
  entity_id    uuid,
  data         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
