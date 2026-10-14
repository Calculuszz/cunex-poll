-- คำตอบของโพล: หนึ่ง response = ผู้ตอบหนึ่งคนส่งหนึ่งครั้ง
-- คำตอบแต่ละข้ออ้างคำถามด้วย position ใน poll_items เพราะคำถามที่ seed ไว้ไม่มี id
-- (แก้ไขคำถามได้เฉพาะตอนเป็น DRAFT ซึ่งยังไม่มีคำตอบ position จึงไม่ขยับหลังเปิดโหวต)
CREATE TABLE poll_responses (
    id         BIGSERIAL PRIMARY KEY,
    poll_id    TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    respondent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX poll_responses_poll_idx ON poll_responses (poll_id);

-- แบบเลือก: หนึ่งแถวต่อหนึ่งตัวเลือกที่ติ๊ก (เลือกได้หลายข้อจึงมีหลายแถว)
-- แบบข้อความ: หนึ่งแถว เก็บใน text_value
CREATE TABLE poll_answers (
    id          BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL REFERENCES poll_responses(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    option_id   TEXT,
    text_value  TEXT,
    CHECK ((option_id IS NULL) <> (text_value IS NULL))
);

CREATE INDEX poll_answers_response_idx ON poll_answers (response_id, position);

-- mock ตามสเปกหน้า dashboard: p1 ข้อ 1 แบบเลือกหนึ่งข้อ 190 คน (70/75/45), ข้อ 2 แบบข้อความ 1 คำตอบ
DELETE FROM poll_items WHERE poll_id = 'p1';
INSERT INTO poll_items (poll_id, position, data) VALUES
    ('p1', 1, '{"kind":"input","id":"p1-1","type":"radio","label":"ธีมงานลอยกระทงที่อยากให้จัดในปีนี้","required":true,"options":[{"id":"p1-1-a","label":"ย้อนยุคสยาม"},{"id":"p1-1-b","label":"ลอยกระทงรักษ์โลก"},{"id":"p1-1-c","label":"แสงสีร่วมสมัย"}]}'),
    ('p1', 2, '{"kind":"input","id":"p1-2","type":"text","label":"ข้อเสนอแนะเพิ่มเติมสำหรับงาน","required":false}');

INSERT INTO poll_responses (poll_id, respondent, created_at)
SELECT 'p1', NULL, timestamptz '2026-10-13 09:00:00+07' + g * interval '7 minutes'
FROM generate_series(1, 190) AS g;

INSERT INTO poll_answers (response_id, position, option_id)
SELECT r.id, 1, CASE WHEN r.n <= 70 THEN 'p1-1-a' WHEN r.n <= 145 THEN 'p1-1-b' ELSE 'p1-1-c' END
FROM (SELECT id, row_number() OVER (ORDER BY id) AS n FROM poll_responses WHERE poll_id = 'p1') AS r;

INSERT INTO poll_answers (response_id, position, text_value)
SELECT id, 2, 'อยากให้มีจุดแยกขยะและกระทงจากวัสดุธรรมชาติให้ซื้อในงาน'
FROM poll_responses WHERE poll_id = 'p1' ORDER BY id DESC LIMIT 1;

-- p3 ปิดโหวตแล้วแต่ยังไม่มีผู้ตอบ ใช้ทดสอบสถานะ "ยังไม่มีผู้ตอบ"
DELETE FROM poll_items WHERE poll_id = 'p3';
INSERT INTO poll_items (poll_id, position, data) VALUES
    ('p3', 1, '{"kind":"input","id":"p3-1","type":"checkbox","label":"ธีมสีที่อยากให้ใช้ในงานกีฬาสี","required":true,"options":[{"id":"p3-1-a","label":"ชมพู-ขาว"},{"id":"p3-1-b","label":"ฟ้า-เหลือง"},{"id":"p3-1-c","label":"เขียว-ส้ม"},{"id":"p3-1-d","label":"ม่วง-เงิน"}]}');
