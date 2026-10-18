import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, pageParams, problem, route, toPage } from '@/mock-api/http'
import { isStaff, visiblePoll } from '@/mock-api/polls'
import { canSeeIdentity, responseRows } from '@/mock-api/responses'

// [เสนอเพิ่ม] คำตอบรายชุด (เจ้าของ/แอดมิน) ใหม่สุดก่อน · ?withIdentity=1 ได้รหัสผู้ตอบตามสิทธิ์ (server ตัดสิน)
export const GET = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    if (!isStaff(user, poll)) throw problem(403, 'FORBIDDEN', 'เฉพาะเจ้าของโพลและแอดมิน')
    const { url, limit, offset } = pageParams(request, 10)
    const withIdentity = canSeeIdentity(user, poll, url.searchParams.get('withIdentity') === '1')
    const [{ rows: total }, rows] = await Promise.all([
        db.query<{ n: number }>('SELECT count(*)::int AS n FROM ballots WHERE poll_id = $1', [pollId]),
        responseRows(pollId, withIdentity, 'desc', limit + 1, offset),
    ])
    return json({ ...toPage(rows, limit, offset), total: total[0].n, identityVisible: withIdentity })
})
