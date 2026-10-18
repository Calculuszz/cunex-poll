import 'server-only'
import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Me } from '@/api/types'
import { db } from './db'
import { problem } from './http'

export const SESSION_COOKIE = 'sid'
const SESSION_DAYS = 7

export type UserRow = {
    id: string
    role: 'user' | 'admin'
    student_id: string | null
    cunex_user_id: string | null
    is_chula_verified: boolean
    faculty_code: string | null
    student_year: number | null
    department_code: string | null
    providers: ('cunex' | 'google')[]
    faculty_name_th: string | null
    faculty_name_en: string | null
}

const USER_SQL = `
    SELECT u.*, f.name_th AS faculty_name_th, f.name_en AS faculty_name_en
    FROM users u LEFT JOIN faculties f ON f.code = u.faculty_code`

// role อ่านใหม่ทุก request การถอด/เพิ่มแอดมินจึงมีผลทันที
export async function currentUser(): Promise<UserRow | null> {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value
    if (!sid) return null
    const { rows } = await db.query<UserRow>(
        `${USER_SQL} JOIN sessions s ON s.user_id = u.id WHERE s.sid = $1 AND s.expires_at > now()`,
        [sid],
    )
    return rows[0] ?? null
}

export async function requireUser() {
    const user = await currentUser()
    if (!user) throw problem(401, 'UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบ')
    return user
}

export async function requireAdmin() {
    const user = await requireUser()
    if (user.role !== 'admin') throw problem(403, 'FORBIDDEN', 'เฉพาะผู้ดูแลระบบ')
    return user
}

export async function findUser(where: string, value: string) {
    const { rows } = await db.query<UserRow>(`${USER_SQL} WHERE ${where} = $1`, [value])
    return rows[0] ?? null
}

// สร้าง session แล้วตั้ง cookie (เรียกได้เฉพาะใน route handler)
export async function startSession(userId: string) {
    const sid = randomBytes(24).toString('base64url')
    await db.query(
        `INSERT INTO sessions (sid, user_id, expires_at) VALUES ($1, $2, now() + $3 * interval '1 day')`,
        [sid, userId, SESSION_DAYS],
    )
    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId])
    ;(await cookies()).set(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DAYS * 24 * 60 * 60,
    })
}

export async function endSession() {
    const store = await cookies()
    const sid = store.get(SESSION_COOKIE)?.value
    if (sid) await db.query('DELETE FROM sessions WHERE sid = $1', [sid])
    store.delete(SESSION_COOKIE)
}

export function toMe(u: UserRow): Me {
    return {
        id: u.id,
        role: u.role,
        studentId: u.student_id,
        isChulaVerified: u.is_chula_verified,
        faculty: u.faculty_code ? { code: u.faculty_code, nameTh: u.faculty_name_th ?? '', nameEn: u.faculty_name_en ?? '' } : null,
        studentYear: u.student_year,
        departmentCode: u.department_code,
        providers: u.providers,
    }
}

// returnTo ต้องเป็น path ภายในแอป ไม่งั้นกลับหน้าแรก (กัน open redirect)
export function safeReturnTo(value: string | null) {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
    return value
}

export async function audit(actorId: string | null, action: string, entityType: string, entityId: string, data: Record<string, unknown> = {}) {
    await db.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, data) VALUES ($1, $2, $3, $4, $5)',
        [actorId, action, entityType, entityId, JSON.stringify(data)],
    )
}
