import { requireUser } from '@/mock-api/auth'
import { readBallot, validateAnswers, writeBallot } from '@/mock-api/ballots'
import { db, tx } from '@/mock-api/db'
import { json, problem, rateLimit, readJson, route } from '@/mock-api/http'
import { isAcceptingVotes, isEligible, loadElements, loadPoll, settingsOf, visiblePoll } from '@/mock-api/polls'

// [เสนอเพิ่ม] ส่ง ballot ใหม่ของโพลที่ลงคะแนนซ้ำได้ (นับทุกครั้ง)
// body { answers, clientToken } · clientToken เดิมซ้ำ = ครั้งเดิม (กดซ้ำ/ยิงใหม่หลังเน็ตหลุดไม่นับเพิ่ม) ตอบ 200 แทน 201
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    rateLimit(`ballot:${user.id}`, 20)
    const body = await readJson(request)
    const token = body.clientToken
    if (typeof token !== 'string' || token.length < 8 || token.length > 100) throw problem(400, 'BAD_REQUEST', 'ต้องส่ง clientToken')
    await visiblePoll(pollId, user)
    const elements = await loadElements(pollId)

    const created = await tx(async (client) => {
        const poll = (await loadPoll(pollId, client, true))!
        if (!isEligible(user, poll.audience)) throw problem(403, 'NOT_ELIGIBLE', 'บัญชีนี้ไม่อยู่ในกลุ่มผู้ตอบของโพล')
        if (!isAcceptingVotes(poll)) throw problem(409, 'POLL_CLOSED', 'โพลปิดรับคำตอบแล้ว')
        if (!settingsOf(poll).allowRepeat) throw problem(409, 'REPEAT_NOT_ALLOWED', 'โพลนี้ไม่เปิดให้ลงคะแนนซ้ำ ใช้ PUT /ballot')
        const { rowCount } = await client.query(
            'SELECT 1 FROM ballots WHERE poll_id = $1 AND voter_key = $2 AND client_token = $3', [pollId, user.id, token])
        if ((rowCount ?? 0) > 0) return false
        const answers = validateAnswers(elements, body.answers)
        await writeBallot(client, pollId, user.id, answers, token)
        await client.query('DELETE FROM ballot_drafts WHERE poll_id = $1 AND voter_key = $2', [pollId, user.id])
        return true
    })
    return json(await readBallot(db, pollId, user.id), created ? 201 : 200)
})
