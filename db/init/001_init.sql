-- schema ชั่วคราวสำหรับ backend ทดสอบ
-- ค่า status/scope ตรงกับ PollStatus และ Scope ใน src/dtos/pollcardDto.tsx

CREATE TYPE poll_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'VOTING', 'DONE', 'REJECTED');
CREATE TYPE poll_scope AS ENUM ('A', 'B', 'C', 'D');

CREATE TABLE polls (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type        poll_status NOT NULL DEFAULT 'DRAFT',
    scope       poll_scope NOT NULL,
    realtime    BOOLEAN NOT NULL DEFAULT FALSE,
    allow_repeat    BOOLEAN NOT NULL DEFAULT FALSE,
    show_explore    BOOLEAN NOT NULL DEFAULT FALSE,
    identify_sender BOOLEAN NOT NULL DEFAULT FALSE,
    -- ขอบเขตผู้ตอบ: { "faculties": [...], "departments": [...], "studentCodes": [...] }
    audience    JSONB NOT NULL DEFAULT '{}'::jsonb,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    close_at    TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- เก็บคำถาม/องค์ประกอบเป็น JSON ตามรูปแบบ FormItem ใน src/store/elementStore.tsx
-- kind = 'input' คือคำถาม, kind = 'element' คือองค์ประกอบ
CREATE TABLE poll_items (
    id       BIGSERIAL PRIMARY KEY,
    poll_id  TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    data     JSONB NOT NULL,
    UNIQUE (poll_id, position)
);

-- seed จากข้อมูล mock ใน src/containers/page/main/mockPolls.ts
INSERT INTO polls (id, type, scope, realtime, title, description, close_at) VALUES
    ('p1', 'VOTING',   'A', TRUE,  'ร้านอาหารที่อยากให้มีในโรงอาหารกลาง', 'ช่วยกันโหวตเมนูที่อยากให้เพิ่มในโรงอาหาร เพื่อนำไปเสนอกับทางร้านค้า', '2026-10-20 17:00:00+07'),
    ('p2', 'APPROVED', 'B', FALSE, 'ความพึงพอใจต่อการลงทะเบียนเรียนออนไลน์', 'แบบสอบถามสำหรับนิสิตคณะวิศวกรรมศาสตร์ เกี่ยวกับระบบลงทะเบียนเรียน', '2026-10-25 23:59:00+07'),
    ('p3', 'DONE',     'C', FALSE, 'เลือกธีมสีของงานกีฬาสี', 'ผลโหวตธีมสีสำหรับงานกีฬาสีประจำปี ปิดรับโหวตแล้ว', '2026-09-30 12:00:00+07'),
    ('p4', 'PENDING',  'D', FALSE, 'แบบประเมินกิจกรรมปฐมนิเทศ', 'กรอกรหัสนิสิตของผู้เข้าร่วมกิจกรรม เพื่อยืนยันสิทธิ์การประเมิน', '2026-11-01 18:00:00+07'),
    ('p5', 'DRAFT',    'A', FALSE, 'ความคิดเห็นเรื่องที่จอดรถในมหาวิทยาลัย', 'ยังไม่ได้ส่งขออนุมัติ', '2026-11-10 17:00:00+07');

INSERT INTO poll_items (poll_id, position, data)
SELECT c.poll_id, g, jsonb_build_object('kind', 'input', 'type', 'text', 'label', 'คำถาม ' || g, 'required', FALSE)
FROM (VALUES ('p1', 3), ('p2', 8), ('p3', 1), ('p4', 5), ('p5', 2)) AS c(poll_id, n)
CROSS JOIN LATERAL generate_series(1, c.n) AS g;
