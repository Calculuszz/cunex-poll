-- ตั้งค่าการเผยแพร่ผลโหวตให้ผู้ตอบ (ตั้งจากหน้า dashboard ของเจ้าของโพล)
-- NULL = ใช้ค่าเริ่มต้นใน src/lib/resultDisplay.ts (เผยแพร่ทุกข้อแบบเลือก มุมมองรายการ เปิดทุกตัวเลข)
-- { "published": bool, "questions": [itemKey] | null, "views": ["list"|"pie"|"bar"],
--   "showCount": bool, "showPercent": bool, "showTotal": bool }
ALTER TABLE polls ADD COLUMN result_display JSONB;
