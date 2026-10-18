import { audit, requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { noContent, problem, route } from '@/mock-api/http'

export const DELETE = route<{ userId: string }>(async (_request, { userId }) => {
    const admin = await requireAdmin()
    if (userId === admin.id) throw problem(409, 'CANNOT_REVOKE_SELF', 'ถอดสิทธิ์ตัวเองไม่ได้')
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw problem(404, 'USER_NOT_FOUND', 'ไม่พบผู้ใช้')
    const { rowCount } = await db.query(`UPDATE users SET role = 'user' WHERE id = $1 AND role = 'admin'`, [userId])
    if (rowCount === 0) throw problem(404, 'USER_NOT_FOUND', 'ไม่พบผู้ดูแลระบบคนนี้')
    await audit(admin.id, 'admin.revoke', 'user', userId)
    return noContent()
})
