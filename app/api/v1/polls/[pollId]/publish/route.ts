import { audit, requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, route } from '@/mock-api/http'
import { loadPoll, ownedPoll, requireStatus, toDetail } from '@/mock-api/polls'

// approved → open · ของจริงจะส่งแจ้งเตือน + ตั้งงานปิดโพลตอน closesAt (mock ปิดตอนมีคนเรียก API หลังเลยเวลา)
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['approved'], 'เปิดโหวตได้เฉพาะโพลที่อนุมัติแล้ว')
    if (!poll.closes_at || poll.closes_at <= new Date()) {
        throw problem(422, 'CLOSES_AT_PASSED', 'เลยเวลาปิดโหวตแล้ว เลื่อนเวลาปิดก่อนเปิดโหวต')
    }
    await db.query(`UPDATE polls SET status = 'open', opened_at = now(), updated_at = now() WHERE id = $1`, [pollId])
    await audit(user.id, 'poll.publish', 'poll', pollId)
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})
