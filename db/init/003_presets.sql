-- preset รหัสสำหรับโพลประเภท "กำหนดจากรหัส" เป็นของผู้ใช้แต่ละคน (owner_student_id)
CREATE TABLE IF NOT EXISTS code_presets (
    id               BIGSERIAL PRIMARY KEY,
    owner_student_id TEXT NOT NULL,
    name             TEXT NOT NULL,
    code_kind        TEXT NOT NULL CHECK (code_kind IN ('STUDENT', 'STAFF')),
    codes            TEXT[] NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS code_presets_owner_idx ON code_presets (owner_student_id, created_at DESC);
