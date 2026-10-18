import { audit, requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, ownedPoll, requireStatus, toDetail } from '@/mock-api/polls'

export const PATCH = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const { closesAt } = await readJson(request)
    if (typeof closesAt !== 'string' || Number.isNaN(Date.parse(closesAt))) throw problem(400, 'BAD_REQUEST', 'closesAt ต้องเป็นวันเวลา ISO-8601')
    if (new Date(closesAt) <= new Date()) throw problem(422, 'CLOSES_AT_PASSED', 'เวลาปิดต้องอยู่ในอนาคต')
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['pending_review', 'approved', 'open'], 'เปลี่ยนเวลาปิดได้เฉพาะโพลที่ส่งแล้วและยังไม่ปิด')
    await db.query('UPDATE polls SET closes_at = $2, updated_at = now() WHERE id = $1', [pollId, closesAt])
    await audit(user.id, 'poll.closes_at', 'poll', pollId, { closesAt })
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})
