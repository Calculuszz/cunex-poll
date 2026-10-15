-- ปิดโหวตก่อนกำหนด (System flow §7): เก็บเวลาที่ปิดจริงแยกจากเวลาที่ตั้งไว้ (close_at)
-- closed_by เป็นข้อมูลภายใน ห้ามส่งไปมุมมองสาธารณะ
ALTER TABLE polls
    ADD COLUMN closed_at    TIMESTAMPTZ,
    ADD COLUMN closed_early BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN close_reason TEXT,
    ADD COLUMN closed_by    TEXT;

-- p1 ชื่อโพลเป็นเรื่องโรงอาหาร แต่คำถามเดิมยกมาจากสเปกหน้า dashboard (ลอยกระทง) จึงแก้คำถามให้ตรงชื่อโพล
-- คง id ตัวเลือกเดิมไว้ คำตอบที่ seed ไว้ (70/75/45) จึงยังนับถูก
UPDATE poll_items SET data = '{"kind":"input","id":"p1-1","type":"radio","label":"ร้านอาหารที่อยากให้เพิ่มในโรงอาหารกลาง","required":true,"options":[{"id":"p1-1-a","label":"ร้านข้าวมันไก่"},{"id":"p1-1-b","label":"ร้านอาหารตามสั่ง"},{"id":"p1-1-c","label":"ร้านอาหารมังสวิรัติ"}]}'
WHERE poll_id = 'p1' AND position = 1;
UPDATE poll_items SET data = '{"kind":"input","id":"p1-2","type":"text","label":"ข้อเสนอแนะเพิ่มเติมสำหรับโรงอาหาร","required":false}'
WHERE poll_id = 'p1' AND position = 2;
UPDATE poll_answers SET text_value = 'อยากให้มีร้านที่เปิดถึงช่วงเย็น สำหรับนิสิตที่เรียนเลิกดึก'
WHERE position = 2 AND text_value = 'อยากให้มีจุดแยกขยะและกระทงจากวัสดุธรรมชาติให้ซื้อในงาน'
  AND response_id IN (SELECT id FROM poll_responses WHERE poll_id = 'p1');

-- หน้ารวมโพลแสดงเฉพาะโพลที่เปิดสวิตช์ "เพิ่มลงหน้า explore" โพลตัวอย่างที่กำลังโหวตจึงเปิดไว้
UPDATE polls SET show_explore = TRUE WHERE id IN ('p1', 'p6');
