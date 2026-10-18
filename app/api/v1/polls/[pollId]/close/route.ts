import { audit, requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, ownedPoll, requireStatus, toDetail } from '@/mock-api/polls'

// ปิดก่อนกำหนด → closed · เหตุผลไม่บังคับ (≤ 500) ผู้ตอบเห็นเป็น closeReason
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const { reason } = await readJson(request)
    if (reason !== undefined && reason !== null && typeof reason !== 'string') throw problem(400, 'BAD_REQUEST', 'reason ต้องเป็นข้อความ')
    const text = typeof reason === 'string' ? reason.trim() : ''
    if (text.length > 500) throw problem(422, 'TOO_LONG', 'เหตุผลยาวได้ไม่เกิน 500 ตัวอักษร')
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['open'], 'ปิดได้เฉพาะโพลที่กำลังเปิดโหวต')
    await db.query(
        `UPDATE polls SET status = 'closed', closed_at = now(), closed_early = now() < closes_at, close_reason = $2, closed_by = $3, updated_at = now()
         WHERE id = $1`,
        [pollId, text || null, user.id],
    )
    await audit(user.id, 'poll.close', 'poll', pollId, { reason: text || null })
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})
