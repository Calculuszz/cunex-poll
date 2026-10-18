import 'server-only'
import type { AdminUser } from '@/api/types'
import { db } from './db'

export async function listAdmins(): Promise<AdminUser[]> {
    const { rows } = await db.query<{ id: string; student_id: string | null; cunex_user_id: string | null; faculty_code: string | null; last_login_at: Date | null }>(
        `SELECT id, student_id, cunex_user_id, faculty_code, last_login_at FROM users WHERE role = 'admin' ORDER BY created_at`)
    return rows.map((r) => ({
        id: r.id, studentId: r.student_id, cunexUserId: r.cunex_user_id, facultyCode: r.faculty_code,
        lastLoginAt: r.last_login_at?.toISOString() ?? null,
    }))
}
