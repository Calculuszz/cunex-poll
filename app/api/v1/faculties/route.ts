import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, route } from '@/mock-api/http'

export const GET = route(async () => {
    await requireUser()
    // departments = [เสนอเพิ่ม] สาขาของแต่ละคณะ
    const { rows } = await db.query(
        `SELECT f.code, f.name_th AS "nameTh", f.name_en AS "nameEn",
                coalesce((SELECT json_agg(json_build_object('code', d.code, 'nameTh', d.name_th, 'nameEn', d.name_en) ORDER BY d.code)
                          FROM departments d WHERE d.faculty_code = f.code), '[]') AS departments
         FROM faculties f ORDER BY f.code`)
    return json(rows, 200, { 'Cache-Control': 'private, max-age=300' })
})
