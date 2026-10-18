import { audit, requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, requireStatus, toDetail } from '@/mock-api/polls'

// → rejected เจ้าของเห็น comment ใน reviews แล้วแก้ส่งใหม่ได้
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const admin = await requireAdmin()
    const { comment } = await readJson(request)
    if (comment !== undefined && comment !== null && typeof comment !== 'string') throw problem(400, 'BAD_REQUEST', 'comment ต้องเป็นข้อความ')
    const text = typeof comment === 'string' ? comment.trim() : ''
    if (text.length > 1000) throw problem(422, 'TOO_LONG', 'ความเห็นยาวได้ไม่เกิน 1000 ตัวอักษร')
    const poll = await loadPoll(pollId)
    if (!poll) throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
    requireStatus(poll, ['pending_review'], 'โพลนี้ไม่ได้รออนุมัติแล้ว')
    await db.query(`UPDATE polls SET status = 'rejected', updated_at = now() WHERE id = $1`, [pollId])
    await db.query(`INSERT INTO reviews (poll_id, reviewer_id, decision, comment) VALUES ($1, $2, 'rejected', $3)`, [pollId, admin.id, text || null])
    await audit(admin.id, 'poll.reject', 'poll', pollId, { comment: text || null })
    return json(await toDetail((await loadPoll(pollId))!, admin, appOrigin(request)))
})
