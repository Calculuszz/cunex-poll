import type { Answer } from '@/api/types'
import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, problem, readJson, route } from '@/mock-api/http'
import { isAcceptingVotes, isEligible, loadElements, visiblePoll } from '@/mock-api/polls'

type P = { pollId: string }

// [เสนอเพิ่ม] ฉบับร่างคำตอบที่ server: กรอกค้างไว้แล้วกลับมาทำต่อได้ทุกเครื่อง · ล้างเมื่อส่ง ballot
export const GET = route<P>(async (_request, { pollId }) => {
    const user = await requireUser()
    await visiblePoll(pollId, user)
    const { rows } = await db.query<{ answers: Answer[]; saved_at: Date }>(
        'SELECT answers, saved_at FROM ballot_drafts WHERE poll_id = $1 AND voter_key = $2', [pollId, user.id])
    if (rows.length === 0) throw problem(404, 'NO_DRAFT', 'ยังไม่มีฉบับร่าง')
    return json({ answers: rows[0].answers, savedAt: rows[0].saved_at.toISOString() })
})

// บันทึกทับทั้งร่าง ตรวจแค่ว่าข้อ/ตัวเลือกมีอยู่จริง (ร่างยังตอบไม่ครบได้)
export const PUT = route<P>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    if (!isEligible(user, poll.audience)) throw problem(403, 'NOT_ELIGIBLE', 'บัญชีนี้ไม่อยู่ในกลุ่มผู้ตอบของโพล')
    if (!isAcceptingVotes(poll)) throw problem(409, 'POLL_CLOSED', 'โพลปิดรับคำตอบแล้ว')
    const { answers } = await readJson(request)
    if (!Array.isArray(answers)) throw problem(400, 'BAD_REQUEST', 'answers ต้องเป็น array')
    const elements = await loadElements(pollId)
    const ids = new Set(elements.map((e) => e.id))
    const clean = (answers as Answer[]).filter((a) => a && typeof a === 'object' && ids.has(a.elementId))
    const { rows } = await db.query<{ saved_at: Date }>(
        `INSERT INTO ballot_drafts (poll_id, voter_key, answers) VALUES ($1, $2, $3)
         ON CONFLICT (poll_id, voter_key) DO UPDATE SET answers = EXCLUDED.answers, saved_at = now()
         RETURNING saved_at`,
        [pollId, user.id, JSON.stringify(clean)],
    )
    return json({ answers: clean, savedAt: rows[0].saved_at.toISOString() })
})

export const DELETE = route<P>(async (_request, { pollId }) => {
    const user = await requireUser()
    await db.query('DELETE FROM ballot_drafts WHERE poll_id = $1 AND voter_key = $2', [pollId, user.id])
    return new Response(null, { status: 204 })
})
