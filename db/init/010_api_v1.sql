-- backend ชั่วคราวตามสัญญา api-endpoints (v1) — แยกไว้ใน schema v1 ไม่ยุ่งกับตารางชุดเดิมใน public
-- โครงตารางเป็นของ mock เท่านั้น backend จริงออกแบบเองได้ สิ่งที่ต้องตรงกันคือรูปของ request/response
CREATE SCHEMA IF NOT EXISTS v1;
SET search_path TO v1;

CREATE TABLE faculties (
    code    TEXT PRIMARY KEY,
    name_th TEXT NOT NULL,
    name_en TEXT NOT NULL
);

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role              TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    display_name      TEXT NOT NULL DEFAULT '',
    email             TEXT,
    student_id        TEXT UNIQUE,
    cunex_user_id     TEXT UNIQUE,
    google_sub        TEXT UNIQUE,
    is_chula_verified BOOLEAN NOT NULL DEFAULT FALSE,
    faculty_code      TEXT REFERENCES faculties(code),
    student_year      INT,
    providers         TEXT[] NOT NULL DEFAULT '{}',
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    sid        TEXT PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE polls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'open', 'closed')),
    version         INT NOT NULL DEFAULT 1,
    title           TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    cover_image_url TEXT,
    closes_at       TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    closed_early    BOOLEAN NOT NULL DEFAULT FALSE,
    close_reason    TEXT,
    -- { type: 'public' } | { type: 'chula' } | { type: 'restricted', rules: [{ facultyCode, studentYear }] }
    audience        JSONB NOT NULL DEFAULT '{"type":"chula"}',
    -- { showResultsRealtime, allowAnswerEdit, listedPublicly }
    settings        JSONB NOT NULL DEFAULT '{"showResultsRealtime":false,"allowAnswerEdit":true,"listedPublicly":true}',
    -- NULL = ค่าเริ่มต้น (เผยแพร่ทุกข้อแบบเลือก มุมมองรายการ เปิดทุกตัวเลข)
    result_display  JSONB,
    -- takedown โดยแอดมิน: ปิดและซ่อนจากหน้ารวมโพล
    taken_down      BOOLEAN NOT NULL DEFAULT FALSE,
    takedown_reason TEXT,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE elements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    position    INT NOT NULL,
    type        TEXT NOT NULL,
    title       TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    config      JSONB NOT NULL DEFAULT '{}',
    UNIQUE (poll_id, position)
);

CREATE TABLE options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id  UUID NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    position    INT NOT NULL,
    label       TEXT NOT NULL,
    description TEXT,
    image_url   TEXT,
    image_alt   TEXT,
    popup       JSONB,
    UNIQUE (element_id, position)
);

-- หนึ่งคนหนึ่ง ballot ต่อโพล (voter_key = id ของผู้ใช้) แก้ได้เมื่อ allowAnswerEdit
CREATE TABLE ballots (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id      UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_key    TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (poll_id, voter_key)
);

CREATE TABLE answers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ballot_id  UUID NOT NULL REFERENCES ballots(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    option_id  UUID REFERENCES options(id) ON DELETE CASCADE,
    text       TEXT
);
CREATE INDEX answers_element_idx ON answers (element_id);

CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    decision    TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ไฟล์ที่ออก uploadUrl ไปแล้ว (mock storage เก็บไฟล์ในเครื่อง)
CREATE TABLE images (
    key        TEXT PRIMARY KEY,
    mime_type  TEXT NOT NULL,
    byte_size  INT NOT NULL,
    created_by UUID REFERENCES users(id),
    uploaded   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── seed ──

INSERT INTO faculties (code, name_th, name_en) VALUES
    ('21', 'วิศวกรรมศาสตร์', 'Engineering'),
    ('22', 'อักษรศาสตร์', 'Arts'),
    ('23', 'วิทยาศาสตร์', 'Science'),
    ('24', 'รัฐศาสตร์', 'Political Science'),
    ('25', 'สถาปัตยกรรมศาสตร์', 'Architecture'),
    ('26', 'พาณิชยศาสตร์และการบัญชี', 'Commerce and Accountancy'),
    ('27', 'ครุศาสตร์', 'Education'),
    ('28', 'นิเทศศาสตร์', 'Communication Arts'),
    ('29', 'เศรษฐศาสตร์', 'Economics'),
    ('30', 'แพทยศาสตร์', 'Medicine'),
    ('34', 'นิติศาสตร์', 'Law'),
    ('38', 'จิตวิทยา', 'Psychology');

-- บัญชีทดสอบ (ล็อกอินผ่าน POST /auth/dev/login หรือปุ่ม CUNEX ในโหมด mock)
INSERT INTO users (id, role, display_name, email, student_id, cunex_user_id, is_chula_verified, faculty_code, student_year, providers) VALUES
    ('11111111-1111-4111-8111-111111111111', 'admin', 'นาโน ทดสอบ', '6734414223@student.chula.ac.th', '6734414223', 'cunex-6734414223', TRUE, '21', 2567, '{cunex}'),
    ('22222222-2222-4222-8222-222222222222', 'user', 'ผู้ใช้ทดสอบ', '6730000121@student.chula.ac.th', '6730000121', 'cunex-6730000121', TRUE, '23', 2567, '{cunex}'),
    ('33333333-3333-4333-8333-333333333333', 'admin', 'แอดมินทดสอบ', '6234213423@student.chula.ac.th', '6234213423', 'cunex-6234213423', TRUE, '29', 2562, '{cunex}');
INSERT INTO users (id, role, display_name, email, google_sub, is_chula_verified, providers) VALUES
    ('44444444-4444-4444-8444-444444444444', 'user', 'ผู้ใช้ Google', 'guest@gmail.com', 'google-guest', FALSE, '{google}');

-- ผู้ตอบจำลอง 190 คน กระจายคณะ/ปีเข้า ไว้ทดสอบผลแยกตามคณะ/ปี
INSERT INTO users (id, display_name, student_id, cunex_user_id, is_chula_verified, faculty_code, student_year, providers)
SELECT ('55555555-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'ผู้ตอบจำลอง ' || g, '68' || lpad(g::text, 8, '0'), 'cunex-seed-' || g, TRUE,
       (ARRAY['21', '23', '29', '28', '22'])[1 + g % 5], 2565 + g % 4, '{cunex}'
FROM generate_series(1, 190) AS g;

-- p1 กำลังเปิดโหวต + ผลเรียลไทม์ (190 ballot: 70/75/45)
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, opened_at, audience, settings) VALUES
    ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'open',
     'ร้านอาหารที่อยากให้มีในโรงอาหารกลาง', 'ช่วยกันโหวตเมนูที่อยากให้เพิ่มในโรงอาหาร เพื่อนำไปเสนอกับทางร้านค้า',
     '2026-10-31 17:00:00+07', '2026-10-10 09:00:00+07', '2026-10-12 09:00:00+07',
     '{"type":"chula"}', '{"showResultsRealtime":true,"allowAnswerEdit":true,"listedPublicly":true}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 1, 'single_choice', 'ร้านอาหารที่อยากให้เพิ่มในโรงอาหารกลาง', TRUE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 2, 'text_question', 'ข้อเสนอแนะเพิ่มเติมสำหรับโรงอาหาร', FALSE, '{"placeholder":"พิมพ์ข้อเสนอแนะ...","maxLength":500}');
INSERT INTO options (id, element_id, position, label) VALUES
    ('c0000000-0000-4000-8000-000000010101', 'b0000000-0000-4000-8000-000000000101', 1, 'ร้านข้าวมันไก่'),
    ('c0000000-0000-4000-8000-000000010102', 'b0000000-0000-4000-8000-000000000101', 2, 'ร้านอาหารตามสั่ง'),
    ('c0000000-0000-4000-8000-000000010103', 'b0000000-0000-4000-8000-000000000101', 3, 'ร้านอาหารมังสวิรัติ');
INSERT INTO ballots (id, poll_id, voter_key, submitted_at)
SELECT ('d0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'a0000000-0000-4000-8000-000000000001',
       ('55555555-0000-4000-8000-' || lpad(g::text, 12, '0')), timestamptz '2026-10-13 09:00:00+07' + g * interval '7 minutes'
FROM generate_series(1, 190) AS g;
INSERT INTO answers (ballot_id, element_id, option_id)
SELECT ('d0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'b0000000-0000-4000-8000-000000000101',
       CASE WHEN g <= 70 THEN 'c0000000-0000-4000-8000-000000010101'::uuid
            WHEN g <= 145 THEN 'c0000000-0000-4000-8000-000000010102'::uuid
            ELSE 'c0000000-0000-4000-8000-000000010103'::uuid END
FROM generate_series(1, 190) AS g;
INSERT INTO answers (ballot_id, element_id, text)
SELECT ('d0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'b0000000-0000-4000-8000-000000000102', t
FROM (VALUES (3, 'อยากให้มีร้านที่เปิดถึงช่วงเย็น สำหรับนิสิตที่เรียนเลิกดึก'),
             (17, 'ขอร้านอาหารฮาลาลเพิ่มอีกสักร้าน'),
             (64, 'ราคาไม่ควรเกิน 50 บาท'),
             (120, 'อยากให้มีที่นั่งเพิ่มช่วงเที่ยง')) AS v(g, t);

-- p2 อนุมัติแล้ว รอเจ้าของกด Publish (เฉพาะคณะวิศวฯ ทุกปี + วิทยาศาสตร์ปีเข้า 2567)
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, audience, settings) VALUES
    ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'approved',
     'ความพึงพอใจต่อการลงทะเบียนเรียนออนไลน์', 'แบบสอบถามเกี่ยวกับระบบลงทะเบียนเรียน',
     '2026-10-28 23:59:00+07', '2026-10-14 10:00:00+07',
     '{"type":"restricted","rules":[{"facultyCode":"21","studentYear":null},{"facultyCode":"23","studentYear":2567}]}',
     '{"showResultsRealtime":false,"allowAnswerEdit":false,"listedPublicly":true}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000201', 'a0000000-0000-4000-8000-000000000002', 1, 'single_choice', 'ความพึงพอใจโดยรวม', TRUE, '{"layout":"list"}');
INSERT INTO options (element_id, position, label) VALUES
    ('b0000000-0000-4000-8000-000000000201', 1, 'พอใจมาก'),
    ('b0000000-0000-4000-8000-000000000201', 2, 'พอใจ'),
    ('b0000000-0000-4000-8000-000000000201', 3, 'ไม่พอใจ');

-- p3 ปิดโหวตแล้ว (สาธารณะ) ยังไม่มีผู้ตอบ
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, opened_at, closed_at, audience, settings) VALUES
    ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'closed',
     'เลือกธีมสีของงานกีฬาสี', 'ผลโหวตธีมสีสำหรับงานกีฬาสีประจำปี ปิดรับโหวตแล้ว',
     '2026-09-30 12:00:00+07', '2026-09-01 10:00:00+07', '2026-09-02 10:00:00+07', '2026-09-30 12:00:00+07',
     '{"type":"public"}', '{"showResultsRealtime":false,"allowAnswerEdit":true,"listedPublicly":true}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000003', 1, 'multi_choice', 'สีที่ชอบ (เลือกได้หลายสี)', TRUE, '{"layout":"list"}');
INSERT INTO options (element_id, position, label) VALUES
    ('b0000000-0000-4000-8000-000000000301', 1, 'ชมพู'),
    ('b0000000-0000-4000-8000-000000000301', 2, 'ฟ้า'),
    ('b0000000-0000-4000-8000-000000000301', 3, 'เหลือง');

-- p4 ถูกปฏิเสธ (แก้แล้วส่งใหม่ได้)
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, audience) VALUES
    ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'rejected',
     'แบบประเมินกิจกรรมปฐมนิเทศ', 'ประเมินกิจกรรมปฐมนิเทศนิสิตใหม่', '2026-11-01 18:00:00+07', '2026-10-01 10:00:00+07', '{"type":"chula"}');
INSERT INTO elements (poll_id, position, type, title, is_required, config) VALUES
    ('a0000000-0000-4000-8000-000000000004', 1, 'text_question', 'ความประทับใจ', FALSE, '{}');
INSERT INTO reviews (poll_id, reviewer_id, decision, comment, created_at) VALUES
    ('a0000000-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', 'rejected',
     'ช่วยเพิ่มคำถามแบบเลือกตอบ และระบุว่ากิจกรรมวันไหน', '2026-10-02 10:00:00+07');

-- p5 ฉบับร่าง
INSERT INTO polls (id, owner_id, status, title, description, closes_at, audience) VALUES
    ('a0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'draft',
     'ความคิดเห็นเรื่องที่จอดรถในมหาวิทยาลัย', 'ยังไม่ได้ส่งขออนุมัติ', '2026-11-10 17:00:00+07', '{"type":"chula"}');
INSERT INTO elements (poll_id, position, type, title, is_required, config) VALUES
    ('a0000000-0000-4000-8000-000000000005', 1, 'text_question', 'ปัญหาที่เจอบ่อยที่สุด', FALSE, '{}');

-- p6 กำลังเปิดโหวต ไม่เรียลไทม์ 3 หน้า (แบ่งด้วย page_break) มี description/accordion/info_popup
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, opened_at, audience, settings) VALUES
    ('a0000000-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'open',
     'แบบสำรวจงานลอยกระทงจุฬาฯ 2569',
     'ชวนนิสิตและบุคลากรร่วมเลือกธีมและกิจกรรมของงานลอยกระทงปีนี้ ผลสำรวจจะนำไปใช้วางแผนงานจริง',
     '2026-10-31 22:00:00+07', '2026-10-05 10:00:00+07', '2026-10-06 10:00:00+07', '{"type":"chula"}',
     '{"showResultsRealtime":false,"allowAnswerEdit":true,"listedPublicly":true}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000601', 'a0000000-0000-4000-8000-000000000006', 1, 'description', NULL, FALSE,
     '{"showHeading":true,"sections":[{"heading":"เกี่ยวกับงาน","body":"งานลอยกระทงจุฬาฯ จัดที่สระน้ำหน้าหอประชุม ช่วงค่ำวันลอยกระทง"}]}'),
    ('b0000000-0000-4000-8000-000000000602', 'a0000000-0000-4000-8000-000000000006', 2, 'single_choice', 'ธีมงานที่อยากให้จัดปีนี้', TRUE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000603', 'a0000000-0000-4000-8000-000000000006', 3, 'multi_choice', 'การแสดงที่อยากดู (เลือกได้หลายข้อ)', FALSE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000604', 'a0000000-0000-4000-8000-000000000006', 4, 'page_break', NULL, FALSE, '{}'),
    ('b0000000-0000-4000-8000-000000000605', 'a0000000-0000-4000-8000-000000000006', 5, 'accordion', NULL, FALSE,
     '{"title":"โซนอาหารมีอะไรบ้าง","body":"มีทั้งอาหารคาว ของหวาน และเครื่องดื่ม จากร้านค้าในมหาวิทยาลัย"}'),
    ('b0000000-0000-4000-8000-000000000606', 'a0000000-0000-4000-8000-000000000006', 6, 'dropdown', 'โซนอาหารที่อยากให้มี', TRUE, '{}'),
    ('b0000000-0000-4000-8000-000000000607', 'a0000000-0000-4000-8000-000000000006', 7, 'single_choice', 'เวิร์กช็อปที่อยากเข้าร่วม', FALSE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000608', 'a0000000-0000-4000-8000-000000000006', 8, 'page_break', NULL, FALSE, '{}'),
    ('b0000000-0000-4000-8000-000000000609', 'a0000000-0000-4000-8000-000000000006', 9, 'info_popup', NULL, FALSE,
     '{"buttonText":"อ่านเรื่องของที่ระลึก","title":"ของที่ระลึก","body":"ของที่ระลึกแจกฟรีให้ผู้ร่วมงาน 500 คนแรก"}'),
    ('b0000000-0000-4000-8000-000000000610', 'a0000000-0000-4000-8000-000000000006', 10, 'single_choice', 'ของที่ระลึกที่อยากได้', FALSE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000611', 'a0000000-0000-4000-8000-000000000006', 11, 'text_question', 'ข้อเสนอแนะเพิ่มเติม', FALSE, '{"placeholder":"พิมพ์ข้อเสนอแนะ...","maxLength":1000}');
INSERT INTO options (element_id, position, label, popup) VALUES
    ('b0000000-0000-4000-8000-000000000602', 1, 'ย้อนยุคสยาม', NULL),
    ('b0000000-0000-4000-8000-000000000602', 2, 'แสงสีร่วมสมัย', '{"buttonText":"ดูรายละเอียด","title":"แสงสีร่วมสมัย","body":"ไฟประดับและโปรเจกชันบนผิวน้ำ"}'),
    ('b0000000-0000-4000-8000-000000000602', 3, 'ลอยกระทงรักษ์โลก', NULL),
    ('b0000000-0000-4000-8000-000000000603', 1, 'รำไทย', NULL),
    ('b0000000-0000-4000-8000-000000000603', 2, 'ดนตรีสด', NULL),
    ('b0000000-0000-4000-8000-000000000603', 3, 'การแสดงพลุ', NULL),
    ('b0000000-0000-4000-8000-000000000606', 1, 'อาหารไทยโบราณ', NULL),
    ('b0000000-0000-4000-8000-000000000606', 2, 'สตรีทฟู้ด', NULL),
    ('b0000000-0000-4000-8000-000000000606', 3, 'ขนมหวาน', NULL),
    ('b0000000-0000-4000-8000-000000000607', 1, 'ทำกระทงใบตอง', NULL),
    ('b0000000-0000-4000-8000-000000000607', 2, 'ร้อยมาลัย', NULL),
    ('b0000000-0000-4000-8000-000000000607', 3, 'วาดโคมไฟ', NULL),
    ('b0000000-0000-4000-8000-000000000610', 1, 'พวงกุญแจ', NULL),
    ('b0000000-0000-4000-8000-000000000610', 2, 'ถุงผ้า', NULL),
    ('b0000000-0000-4000-8000-000000000610', 3, 'โปสการ์ด', NULL);

-- p7 รออนุมัติ (ของผู้ใช้ทดสอบ) ไว้ทดสอบคิวแอดมิน
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, audience) VALUES
    ('a0000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'pending_review',
     'เวลาเปิดห้องสมุดช่วงสอบ', 'อยากให้ห้องสมุดเปิดถึงกี่โมงช่วงสอบปลายภาค', '2026-11-20 18:00:00+07', '2026-10-16 09:00:00+07', '{"type":"chula"}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000701', 'a0000000-0000-4000-8000-000000000007', 1, 'single_choice', 'เวลาปิดที่อยากได้', TRUE, '{"layout":"list"}');
INSERT INTO options (element_id, position, label) VALUES
    ('b0000000-0000-4000-8000-000000000701', 1, '22:00'),
    ('b0000000-0000-4000-8000-000000000701', 2, '24:00'),
    ('b0000000-0000-4000-8000-000000000701', 3, 'เปิด 24 ชั่วโมง');

RESET search_path;
