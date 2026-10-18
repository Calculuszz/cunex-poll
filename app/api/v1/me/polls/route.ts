import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, pageParams, route, toPage } from '@/mock-api/http'
import { SUMMARY_SQL, sweepExpired, toSummary, type PollRow } from '@/mock-api/polls'

// โพลที่ฉันสร้าง ทุกสถานะ ใหม่สุดก่อน
export const GET = route(async (request) => {
    const user = await requireUser()
    await sweepExpired()
    const { url, limit, offset } = pageParams(request)
    const status = url.searchParams.get('status')
    const { rows } = await db.query<PollRow & { question_count: number }>(
        `SELECT * FROM (${SUMMARY_SQL}) p
         WHERE p.owner_id = $1 AND p.deleted_at IS NULL AND ($2::text IS NULL OR p.status = $2)
         ORDER BY p.created_at DESC, p.id LIMIT $3 OFFSET $4`,
        [user.id, status || null, limit + 1, offset],
    )
    const page = toPage(rows, limit, offset)
    return json({ items: page.items.map(toSummary), nextCursor: page.nextCursor })
})
