-- หน้ากรอกโพล: เก็บคำตอบที่ยังกรอกไม่เสร็จเป็นฉบับร่างที่ server ให้ "โหวตต่อ" ข้ามเครื่องได้
-- ฉบับร่างใช้ตาราง poll_responses ตัวเดิม แยกด้วย status ผลโหวตทุกที่ต้องนับเฉพาะ SUBMITTED
ALTER TABLE poll_responses
    ADD COLUMN status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED')),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- token จากฝั่ง client ตอนกดส่ง กดซ้ำ/ยิงซ้ำด้วย token เดิมจะได้คำตอบเดิม ไม่เกิดคะแนนสองครั้ง
    ADD COLUMN client_token TEXT;

-- ผู้ตอบหนึ่งคนมีฉบับร่างได้ใบเดียวต่อโพล
CREATE UNIQUE INDEX poll_responses_one_draft ON poll_responses (poll_id, respondent) WHERE status = 'DRAFT';
CREATE UNIQUE INDEX poll_responses_client_token ON poll_responses (poll_id, client_token) WHERE client_token IS NOT NULL;

-- mock ตามสเปกหน้ากรอกโพล: 3 หน้า (แบ่งด้วย pagebreak) ข้อ 1 เลือกข้อเดียว ข้อ 2–5 เลือกหลายข้อ ข้อ 6 ข้อความ
-- ข้อ 1 ใช้ตัวเลือกตามสเปก ข้ออื่นมีตัวเลือกของตัวเองให้ตรงกับคำถาม
-- ไม่เปิด realtime เพื่อทดสอบทางที่ส่งแล้วขึ้นหน้าขอบคุณ (p1 เปิด realtime ไว้ทดสอบอีกทาง)
INSERT INTO polls (id, type, scope, realtime, allow_repeat, title, description, close_at) VALUES
    ('p6', 'VOTING', 'A', FALSE, FALSE, 'แบบสำรวจงานลอยกระทงจุฬาฯ 2569',
     'ชวนนิสิตและบุคลากรร่วมเลือกธีมและกิจกรรมของงานลอยกระทงปีนี้ ผลสำรวจจะนำไปใช้วางแผนงานจริง ใช้เวลาไม่นาน และระบบจะไม่แสดงชื่อผู้ตอบให้ผู้จัดงานเห็น',
     '2026-10-31 22:00:00+07');

INSERT INTO poll_items (poll_id, position, data) VALUES
    ('p6', 1, '{"kind":"element","id":"p6-e1","type":"text","title":"ก่อนเริ่ม","body":"งานลอยกระทงจัดที่ลานหน้าหอประชุมจุฬาฯ เลือกได้ตามความชอบของคุณ"}'),
    ('p6', 2, '{"kind":"input","id":"p6-q1","type":"radio","label":"ธีมหลักของงานที่อยากให้จัด","required":true,"options":[{"id":"p6-q1-a","label":"ย้อนยุคสยาม"},{"id":"p6-q1-b","label":"แสงสีร่วมสมัย"},{"id":"p6-q1-c","label":"ลอยกระทงรักษ์โลก"}]}'),
    ('p6', 3, '{"kind":"input","id":"p6-q2","type":"checkbox","label":"การแสดงบนเวทีที่อยากดู","required":true,"options":[{"id":"p6-q2-a","label":"รำไทย"},{"id":"p6-q2-b","label":"ดนตรีสด"},{"id":"p6-q2-c","label":"การแสดงพลุ"}]}'),
    ('p6', 4, '{"kind":"element","id":"p6-e2","type":"pagebreak"}'),
    ('p6', 5, '{"kind":"input","id":"p6-q3","type":"checkbox","label":"โซนอาหารที่อยากให้มี","required":false,"options":[{"id":"p6-q3-a","label":"อาหารไทยโบราณ"},{"id":"p6-q3-b","label":"สตรีทฟู้ด"},{"id":"p6-q3-c","label":"ขนมหวาน"}]}'),
    ('p6', 6, '{"kind":"element","id":"p6-e3","type":"accordion","title":"ลอยกระทงรักษ์โลกคืออะไร","body":"ใช้กระทงจากวัสดุธรรมชาติ แยกขยะในงาน และเก็บกระทงขึ้นจากน้ำหลังจบงาน"}'),
    ('p6', 7, '{"kind":"input","id":"p6-q4","type":"checkbox","label":"กิจกรรมเวิร์กช็อปที่อยากเข้าร่วม","required":false,"options":[{"id":"p6-q4-a","label":"ทำกระทงใบตอง"},{"id":"p6-q4-b","label":"ร้อยมาลัย"},{"id":"p6-q4-c","label":"วาดโคมไฟ"}]}'),
    ('p6', 8, '{"kind":"element","id":"p6-e4","type":"pagebreak"}'),
    ('p6', 9, '{"kind":"input","id":"p6-q5","type":"checkbox","label":"ของที่ระลึกที่อยากได้","required":true,"options":[{"id":"p6-q5-a","label":"พวงกุญแจ"},{"id":"p6-q5-b","label":"ถุงผ้า"},{"id":"p6-q5-c","label":"โปสการ์ด"}]}'),
    ('p6', 10, '{"kind":"input","id":"p6-q6","type":"text","label":"ข้อเสนอแนะเพิ่มเติม","required":false,"placeholder":"พิมพ์ความเห็นของคุณ..."}');
