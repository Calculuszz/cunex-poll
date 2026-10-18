-- ส่วนที่ "เสนอเพิ่ม" จากสัญญา api-endpoints v1 (ฟีเจอร์ที่หน้าเว็บมีแต่สัญญายังไม่มีเส้นรองรับ)
-- รายละเอียดเส้นที่เสนออยู่ในโน้ต Obsidian: Frontend ↔ API v1 → "เส้นที่เสนอเพิ่ม"
SET search_path TO v1;

-- สาขา (ขอบเขตผู้ตอบระดับสาขา)
CREATE TABLE departments (
    code         TEXT PRIMARY KEY,
    faculty_code TEXT NOT NULL REFERENCES faculties(code),
    name_th      TEXT NOT NULL,
    name_en      TEXT NOT NULL
);
ALTER TABLE users ADD COLUMN department_code TEXT REFERENCES departments(code);

-- ใครกดปิดโพล (ข้อมูลภายใน เห็นเฉพาะแอดมิน)
ALTER TABLE polls ADD COLUMN closed_by UUID REFERENCES users(id);

-- ลงคะแนนซ้ำ: หนึ่งคนส่งได้หลาย ballot (นับทุกครั้ง) จึงเลิกบังคับ unique ที่ตาราง ไปตรวจในโค้ดแทนสำหรับโพลที่ไม่ให้ซ้ำ
-- client_token กันกดส่งซ้ำ/ยิงใหม่หลังเน็ตหลุดแล้วนับสองครั้ง
ALTER TABLE ballots DROP CONSTRAINT ballots_poll_id_voter_key_key;
ALTER TABLE ballots ADD COLUMN client_token TEXT;
CREATE UNIQUE INDEX ballots_client_token_idx ON ballots (poll_id, voter_key, client_token) WHERE client_token IS NOT NULL;
CREATE INDEX ballots_voter_idx ON ballots (poll_id, voter_key);

-- ฉบับร่างคำตอบที่ server (หนึ่งร่างต่อคนต่อโพล ล้างเมื่อส่ง)
CREATE TABLE ballot_drafts (
    poll_id   UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_key TEXT NOT NULL,
    answers   JSONB NOT NULL DEFAULT '[]',
    saved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, voter_key)
);

-- preset รายชื่อรหัส (ของผู้ใช้แต่ละคน) ใช้กับโพลแบบกำหนดรหัส
CREATE TABLE code_presets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    code_kind  TEXT NOT NULL CHECK (code_kind IN ('STUDENT', 'STAFF')),
    codes      TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── seed ──

INSERT INTO departments (code, faculty_code, name_th, name_en) VALUES
    ('21-cp', '21', 'วิศวกรรมคอมพิวเตอร์', 'Computer Engineering'),
    ('21-ee', '21', 'วิศวกรรมไฟฟ้า', 'Electrical Engineering'),
    ('21-ce', '21', 'วิศวกรรมโยธา', 'Civil Engineering'),
    ('22-th', '22', 'ภาษาไทย', 'Thai'),
    ('22-en', '22', 'ภาษาอังกฤษ', 'English'),
    ('23-math', '23', 'คณิตศาสตร์', 'Mathematics'),
    ('23-chem', '23', 'เคมี', 'Chemistry'),
    ('23-phys', '23', 'ฟิสิกส์', 'Physics'),
    ('28-mass', '28', 'การสื่อสารมวลชน', 'Mass Communication'),
    ('28-film', '28', 'ภาพยนตร์', 'Film'),
    ('29-fin', '29', 'เศรษฐศาสตร์การเงิน', 'Financial Economics'),
    ('29-intl', '29', 'เศรษฐศาสตร์ระหว่างประเทศ', 'International Economics');

UPDATE users SET department_code = '21-cp' WHERE student_id = '6734414223';
UPDATE users SET department_code = '23-chem' WHERE student_id = '6730000121';
UPDATE users SET department_code = '29-fin' WHERE student_id = '6234213423';

-- โพลตัวอย่างค่าตั้งใหม่: p1 ลงคะแนนซ้ำได้ · p6 แก้คำตอบได้ (เดิม)
UPDATE polls SET settings = settings || '{"allowRepeat":true,"identifySender":false}' WHERE id = 'a0000000-0000-4000-8000-000000000001';
UPDATE polls SET settings = settings || '{"allowRepeat":false,"identifySender":false}' WHERE id <> 'a0000000-0000-4000-8000-000000000001';

-- p8 โพลกำหนดรหัส (เปิดอยู่ ระบุคนส่ง) ผู้ใช้ทดสอบ 6730000121 อยู่ในรายชื่อ
INSERT INTO polls (id, owner_id, status, title, description, closes_at, submitted_at, opened_at, audience, settings) VALUES
    ('a0000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'open',
     'แบบทดสอบท้ายกิจกรรมอบรม', 'เฉพาะผู้เข้าอบรม ระบบเก็บรหัสผู้ตอบเพื่อตรวจคะแนน',
     '2026-11-15 18:00:00+07', '2026-10-15 10:00:00+07', '2026-10-16 10:00:00+07',
     '{"type":"codes","codeKind":"STUDENT","codes":["6730000121","6734414223","6400000001"]}',
     '{"showResultsRealtime":false,"allowAnswerEdit":false,"listedPublicly":true,"allowRepeat":false,"identifySender":true}');
INSERT INTO elements (id, poll_id, position, type, title, is_required, config) VALUES
    ('b0000000-0000-4000-8000-000000000801', 'a0000000-0000-4000-8000-000000000008', 1, 'single_choice', '2 + 2 เท่ากับเท่าไร', TRUE, '{"layout":"list"}'),
    ('b0000000-0000-4000-8000-000000000802', 'a0000000-0000-4000-8000-000000000008', 2, 'text_question', 'สิ่งที่ได้เรียนรู้จากการอบรม', FALSE, '{}');
INSERT INTO options (element_id, position, label) VALUES
    ('b0000000-0000-4000-8000-000000000801', 1, '3'),
    ('b0000000-0000-4000-8000-000000000801', 2, '4'),
    ('b0000000-0000-4000-8000-000000000801', 3, '5');

INSERT INTO code_presets (owner_id, name, code_kind, codes) VALUES
    ('11111111-1111-4111-8111-111111111111', 'ผู้เข้าอบรมรุ่น 1', 'STUDENT', '{6730000121,6734414223,6400000001}');

RESET search_path;
