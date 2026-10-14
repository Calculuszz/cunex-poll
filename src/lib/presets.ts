import { connection } from 'next/server'
import { pool } from '@/lib/db'
import { CURRENT_USER } from '@/lib/currentUser'
import type { PresetKind } from '@/lib/presetInput'

export type PresetRow = { id: number; name: string; codeKind: PresetKind; codes: string[]; createdAt: Date }

// preset เป็นของผู้ใช้แต่ละคน ทุกคำสั่งกรองด้วยเจ้าของ ตอนนี้ยังไม่มี auth จึงใช้ผู้ใช้ปัจจุบันเสมอ
export async function getPresets(): Promise<PresetRow[]> {
    await connection()
    const { rows } = await pool.query<PresetRow>(
        `SELECT id::int AS id, name, code_kind AS "codeKind", codes, created_at AS "createdAt"
         FROM code_presets
         WHERE owner_student_id = $1
         ORDER BY created_at DESC`,
        [CURRENT_USER.studentId],
    )
    return rows
}

export async function createPreset(name: string, codeKind: PresetKind, codes: string[]): Promise<number> {
    const { rows } = await pool.query<{ id: number }>(
        `INSERT INTO code_presets (owner_student_id, name, code_kind, codes)
         VALUES ($1, $2, $3, $4)
         RETURNING id::int AS id`,
        [CURRENT_USER.studentId, name, codeKind, codes],
    )
    return rows[0].id
}

// คืน false ถ้าไม่พบ preset ของผู้ใช้คนนี้
export async function renamePreset(id: number, name: string): Promise<boolean> {
    const { rowCount } = await pool.query(
        'UPDATE code_presets SET name = $1 WHERE id = $2 AND owner_student_id = $3',
        [name, id, CURRENT_USER.studentId],
    )
    return rowCount === 1
}

// คืน false ถ้าไม่พบ preset ของผู้ใช้คนนี้
export async function deletePreset(id: number): Promise<boolean> {
    const { rowCount } = await pool.query(
        'DELETE FROM code_presets WHERE id = $1 AND owner_student_id = $2',
        [id, CURRENT_USER.studentId],
    )
    return rowCount === 1
}
