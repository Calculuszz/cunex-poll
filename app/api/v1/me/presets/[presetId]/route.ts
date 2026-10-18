import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, noContent, problem, readJson, route } from '@/mock-api/http'
import { PRESET_SQL, parsePresetName } from '@/mock-api/presets'

type P = { presetId: string }
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v)

// [เสนอเพิ่ม] เปลี่ยนชื่อ preset
export const PATCH = route<P>(async (request, { presetId }) => {
    const user = await requireUser()
    const name = parsePresetName((await readJson(request)).name)
    if (!isUuid(presetId)) throw problem(404, 'PRESET_NOT_FOUND', 'ไม่พบ preset')
    const { rowCount } = await db.query('UPDATE code_presets SET name = $1 WHERE id = $2 AND owner_id = $3', [name, presetId, user.id])
    if (!rowCount) throw problem(404, 'PRESET_NOT_FOUND', 'ไม่พบ preset')
    const { rows } = await db.query(`${PRESET_SQL} WHERE id = $1`, [presetId])
    return json(rows[0])
})

export const DELETE = route<P>(async (_request, { presetId }) => {
    const user = await requireUser()
    if (!isUuid(presetId)) throw problem(404, 'PRESET_NOT_FOUND', 'ไม่พบ preset')
    const { rowCount } = await db.query('DELETE FROM code_presets WHERE id = $1 AND owner_id = $2', [presetId, user.id])
    if (!rowCount) throw problem(404, 'PRESET_NOT_FOUND', 'ไม่พบ preset')
    return noContent()
})
