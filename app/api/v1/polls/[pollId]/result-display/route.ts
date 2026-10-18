import type { ResultDisplay, ResultView } from '@/api/types'
import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, problem, readJson, route } from '@/mock-api/http'
import { ownedPoll, requireStatus } from '@/mock-api/polls'

const VIEWS: ResultView[] = ['list', 'pie', 'bar']

// ตั้งค่าการเผยแพร่ผลให้ผู้ตอบ ได้เฉพาะตอนเปิดโหวตหรือปิดแล้ว
export const PUT = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const b = await readJson(request)
    const bool = (k: string) => {
        if (typeof b[k] !== 'boolean') throw problem(400, 'BAD_REQUEST', `${k} ต้องเป็น boolean`)
        return b[k] as boolean
    }
    const views = b.views
    if (!Array.isArray(views) || views.length < 1 || views.length > 3 || !views.every((v) => VIEWS.includes(v))) {
        throw problem(400, 'BAD_REQUEST', 'views ต้องมี 1–3 ค่าจาก list, pie, bar')
    }
    const elementIds = b.elementIds
    if (elementIds !== null && !(Array.isArray(elementIds) && elementIds.every((v) => typeof v === 'string'))) {
        throw problem(400, 'BAD_REQUEST', 'elementIds ต้องเป็น array ของ id หรือ null')
    }
    const display: ResultDisplay = {
        published: bool('published'),
        elementIds: elementIds as string[] | null,
        views: [...new Set(views)] as ResultView[],
        showCount: bool('showCount'),
        showPercent: bool('showPercent'),
        showTotal: bool('showTotal'),
    }
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['open', 'closed'], 'ตั้งค่าเผยแพร่ผลได้เฉพาะโพลที่เปิดโหวตแล้ว')
    await db.query('UPDATE polls SET result_display = $2, updated_at = now() WHERE id = $1', [pollId, JSON.stringify(display)])
    return json(display)
})
