import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, pageParams, problem, route, toPage } from '@/mock-api/http'
import { isStaff, visiblePoll } from '@/mock-api/polls'

// คำตอบแบบข้อความของคำถามหนึ่งข้อ (เจ้าของ/แอดมิน)
export const GET = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    if (!isStaff(user, poll)) throw problem(403, 'FORBIDDEN', 'เฉพาะเจ้าของโพลและแอดมิน')
    const { url, limit, offset } = pageParams(request)
    const elementId = url.searchParams.get('elementId')
    if (!elementId || !/^[0-9a-f-]{36}$/i.test(elementId)) throw problem(400, 'BAD_REQUEST', 'ต้องส่ง elementId')
    // createdAt [เสนอเพิ่ม]: หน้าเว็บโชว์เวลาและเรียงใหม่สุดก่อน (สัญญาเดิมตั้งใจไม่ส่งเวลา/สุ่มลำดับ — ต้องเคาะกับ backend)
    const { rows } = await db.query<{ text: string; created_at: Date }>(
        `SELECT a.text, b.submitted_at AS created_at FROM answers a JOIN ballots b ON b.id = a.ballot_id
         WHERE b.poll_id = $1 AND a.element_id = $2 AND a.text IS NOT NULL
         ORDER BY b.submitted_at DESC, a.id LIMIT $3 OFFSET $4`,
        [pollId, elementId, limit + 1, offset],
    )
    return json(toPage(rows.map((r) => ({ text: r.text, createdAt: r.created_at.toISOString() })), limit, offset))
})
