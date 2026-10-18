import { listAdmins } from '@/mock-api/admins'
import { audit, requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, problem, readJson, route } from '@/mock-api/http'

export const GET = route(async () => {
    await requireAdmin()
    return json(await listAdmins())
})

// เพิ่มแอดมินด้วยรหัสนิสิต · คนนั้นต้องเคยล็อกอินด้วย CUNEX มาก่อน
export const POST = route(async (request) => {
    const admin = await requireAdmin()
    const { studentId } = await readJson(request)
    if (typeof studentId !== 'string' || !/^\d{10}$/.test(studentId)) throw problem(400, 'BAD_REQUEST', 'studentId ต้องเป็นตัวเลข 10 หลัก')
    const { rows } = await db.query<{ id: string }>(
        `UPDATE users SET role = 'admin' WHERE student_id = $1 AND 'cunex' = ANY(providers) RETURNING id`, [studentId])
    if (rows.length === 0) throw problem(404, 'USER_NOT_FOUND', 'ยังไม่มีผู้ใช้รหัสนี้ ต้องเข้าสู่ระบบด้วย CUNEX ก่อนหนึ่งครั้ง')
    await audit(admin.id, 'admin.grant', 'user', rows[0].id, { studentId })
    return json(await listAdmins())
})
