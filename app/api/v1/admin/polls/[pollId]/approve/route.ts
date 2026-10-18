import { audit, requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, route } from '@/mock-api/http'
import { loadPoll, requireStatus, toDetail } from '@/mock-api/polls'

// → approved แล้วเจ้าของกด Publish เอง
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const admin = await requireAdmin()
    const poll = await loadPoll(pollId)
    if (!poll) throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
    requireStatus(poll, ['pending_review'], 'โพลนี้ไม่ได้รออนุมัติแล้ว')
    if (!poll.closes_at || poll.closes_at <= new Date()) throw problem(422, 'CLOSES_AT_PASSED', 'เลยเวลาปิดโหวตไปแล้วระหว่างรออนุมัติ')
    await db.query(`UPDATE polls SET status = 'approved', updated_at = now() WHERE id = $1`, [pollId])
    await db.query(`INSERT INTO reviews (poll_id, reviewer_id, decision) VALUES ($1, $2, 'approved')`, [pollId, admin.id])
    await audit(admin.id, 'poll.approve', 'poll', pollId)
    return json(await toDetail((await loadPoll(pollId))!, admin, appOrigin(request)))
})
