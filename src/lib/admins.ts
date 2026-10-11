import { connection } from 'next/server'
import { pool } from '@/lib/db'
import { CURRENT_USER } from '@/lib/currentUser'

export type AdminRow = { studentId: string; isCurrentUser: boolean }

// ผู้ใช้ปัจจุบันแสดงเป็นอันแรกเสมอ ไม่ได้เก็บในตาราง admins
export async function getAdmins(): Promise<AdminRow[]> {
    await connection()
    const { rows } = await pool.query<{ student_id: string }>(
        'SELECT student_id FROM admins ORDER BY created_at ASC',
    )
    const others = rows
        .filter((row) => row.student_id !== CURRENT_USER.studentId)
        .map((row) => ({ studentId: row.student_id, isCurrentUser: false }))
    return [{ studentId: CURRENT_USER.studentId, isCurrentUser: true }, ...others]
}

// ผู้ใช้ปัจจุบันถือเป็นแอดมินเสมอ (แสดงอยู่ในรายการแอดมินทุกครั้ง) จนกว่าจะมีระบบ auth
export async function isAdmin(studentId: string): Promise<boolean> {
    await connection()
    if (studentId === CURRENT_USER.studentId) return true
    const { rowCount } = await pool.query('SELECT 1 FROM admins WHERE student_id = $1', [studentId])
    return rowCount === 1
}

// คืน false ถ้ามีรหัสนี้อยู่แล้ว
export async function addAdmin(studentId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
        'INSERT INTO admins (student_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [studentId],
    )
    return rowCount === 1
}

// คืน false ถ้าไม่พบรหัสนี้ในตาราง
export async function removeAdmin(studentId: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM admins WHERE student_id = $1', [studentId])
    return rowCount === 1
}
