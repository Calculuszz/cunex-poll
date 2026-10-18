import { requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, pageParams, route, toPage } from '@/mock-api/http'
import { SUMMARY_SQL, sweepExpired, toSummary, type PollRow } from '@/mock-api/polls'

// คิวพิจารณา: pending_review เรียงส่งก่อนได้ก่อน · สถานะอื่นใหม่สุดก่อน · ไม่ส่ง status = ทุกสถานะยกเว้นฉบับร่าง
export const GET = route(async (request) => {
    await requireAdmin()
    await sweepExpired()
    const { url, limit, offset } = pageParams(request)
    const status = url.searchParams.get('status')
    const order = status === 'pending_review' ? 'p.submitted_at ASC' : 'p.created_at DESC'
    const { rows } = await db.query<PollRow & { question_count: number }>(
        `SELECT * FROM (${SUMMARY_SQL}) p
         WHERE p.deleted_at IS NULL AND ($1::text IS NULL AND p.status <> 'draft' OR p.status = $1)
         ORDER BY ${order}, p.id LIMIT $2 OFFSET $3`,
        [status || null, limit + 1, offset],
    )
    const page = toPage(rows, limit, offset)
    return json({ items: page.items.map(toSummary), nextCursor: page.nextCursor })
})
