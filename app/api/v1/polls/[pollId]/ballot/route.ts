import { requireUser } from '@/mock-api/auth'
import { readBallot, validateAnswers, writeBallot } from '@/mock-api/ballots'
import { db, tx } from '@/mock-api/db'
import { json, problem, rateLimit, readJson, route } from '@/mock-api/http'
import { isAcceptingVotes, isEligible, loadElements, loadPoll, settingsOf, visiblePoll } from '@/mock-api/polls'

type P = { pollId: string }

// คำตอบของฉัน (ไว้เติมตอนแก้คำตอบ) · โพลที่ลงคะแนนซ้ำได้คืนครั้งล่าสุด
export const GET = route<P>(async (_request, { pollId }) => {
    const user = await requireUser()
    await visiblePoll(pollId, user)
    const ballot = await readBallot(db, pollId, user.id)
    if (!ballot) throw problem(404, 'NO_BALLOT', 'ยังไม่ได้ตอบโพลนี้')
    return json(ballot)
})

// ส่งหรือแทนที่คำตอบของฉัน (upsert) · 201 ครั้งแรก, 200 ตอนแก้
// โพลที่ลงคะแนนซ้ำได้ [เสนอเพิ่ม] ต้องใช้ POST /ballots (นับทุกครั้ง) แทน
export const PUT = route<P>(async (request, { pollId }) => {
    const user = await requireUser()
    rateLimit(`ballot:${user.id}`, 20)
    const body = await readJson(request)
    await visiblePoll(pollId, user)
    const elements = await loadElements(pollId)

    const created = await tx(async (client) => {
        // ล็อกแถวโพลไว้ระหว่างบันทึก: ไม่มีคำตอบหลุดเข้ามาหลังปิด และกดส่งรัวๆ ครั้งแรกก็ได้ ballot เดียว
        const poll = (await loadPoll(pollId, client, true))!
        const settings = settingsOf(poll)
        if (!isEligible(user, poll.audience)) throw problem(403, 'NOT_ELIGIBLE', 'บัญชีนี้ไม่อยู่ในกลุ่มผู้ตอบของโพล')
        if (!isAcceptingVotes(poll)) throw problem(409, 'POLL_CLOSED', 'โพลปิดรับคำตอบแล้ว')
        if (settings.allowRepeat) throw problem(409, 'USE_POST_BALLOTS', 'โพลนี้ลงคะแนนซ้ำได้ ใช้ POST /ballots')
        const { rowCount } = await client.query('SELECT 1 FROM ballots WHERE poll_id = $1 AND voter_key = $2', [pollId, user.id])
        const exists = (rowCount ?? 0) > 0
        if (exists && !settings.allowAnswerEdit) throw problem(409, 'ALREADY_VOTED', 'ตอบโพลนี้ไปแล้ว')
        const answers = validateAnswers(elements, body.answers)
        await writeBallot(client, pollId, user.id, answers)
        await client.query('DELETE FROM ballot_drafts WHERE poll_id = $1 AND voter_key = $2', [pollId, user.id])
        return !exists
    })
    return json(await readBallot(db, pollId, user.id), created ? 201 : 200)
})
