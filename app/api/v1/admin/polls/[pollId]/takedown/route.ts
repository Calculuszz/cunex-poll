import { audit, requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, requireStatus, toDetail } from '@/mock-api/polls'

// บังคับปิดโพลที่เปิด/ปิดแล้ว และซ่อนจากหน้ารวมโพล
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const admin = await requireAdmin()
    const { reason } = await readJson(request)
    if (typeof reason !== 'string' || !reason.trim()) throw problem(400, 'BAD_REQUEST', 'ต้องระบุเหตุผล')
    if (reason.trim().length > 500) throw problem(422, 'TOO_LONG', 'เหตุผลยาวได้ไม่เกิน 500 ตัวอักษร')
    const poll = await loadPoll(pollId)
    if (!poll) throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
    requireStatus(poll, ['open', 'closed'], 'ถอดได้เฉพาะโพลที่เปิดโหวตแล้ว')
    await db.query(
        `UPDATE polls SET status = 'closed', taken_down = TRUE, takedown_reason = $2,
            closed_at = coalesce(closed_at, now()), closed_early = CASE WHEN status = 'open' THEN now() < closes_at ELSE closed_early END,
            closed_by = coalesce(closed_by, $3), updated_at = now()
         WHERE id = $1`,
        [pollId, reason.trim(), admin.id],
    )
    await audit(admin.id, 'poll.takedown', 'poll', pollId, { reason: reason.trim() })
    return json(await toDetail((await loadPoll(pollId))!, admin, appOrigin(request)))
})
