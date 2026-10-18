import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, readJson, route } from '@/mock-api/http'
import { PRESET_SQL, parsePreset } from '@/mock-api/presets'

// [เสนอเพิ่ม] preset รายชื่อรหัสของผู้ใช้ (ใช้กับโพลแบบกำหนดรหัส)
export const GET = route(async () => {
    const user = await requireUser()
    const { rows } = await db.query(`${PRESET_SQL} WHERE owner_id = $1 ORDER BY created_at DESC`, [user.id])
    return json(rows)
})

export const POST = route(async (request) => {
    const user = await requireUser()
    const { name, codeKind, codes } = parsePreset(await readJson(request))
    const { rows } = await db.query<{ id: string }>(
        'INSERT INTO code_presets (owner_id, name, code_kind, codes) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.id, name, codeKind, codes],
    )
    const { rows: created } = await db.query(`${PRESET_SQL} WHERE id = $1`, [rows[0].id])
    return json(created[0], 201)
})
