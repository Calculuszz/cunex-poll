-- ผู้ดูแลระบบที่เพิ่มเพิ่มเติม (นอกจากผู้ใช้ปัจจุบัน ซึ่งแสดงเสมอจาก src/lib/currentUser.ts)
CREATE TABLE IF NOT EXISTS admins (
    student_id TEXT PRIMARY KEY CHECK (student_id ~ '^\d{10}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
