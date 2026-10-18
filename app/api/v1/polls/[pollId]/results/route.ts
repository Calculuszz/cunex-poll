import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, problem, route } from '@/mock-api/http'
import { canViewResults, isStaff, visiblePoll } from '@/mock-api/polls'
import { computeResults } from '@/mock-api/results'

// ผลโหวต · ผู้ตอบเห็นได้ตามที่เจ้าของเผยแพร่ · ส่ง ETag ให้ถามซ้ำแล้วได้ 304 ถ้าผลไม่เปลี่ยน
export const GET = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    const staff = isStaff(user, poll)
    const { rowCount } = await db.query('SELECT 1 FROM ballots WHERE poll_id = $1 AND voter_key = $2 LIMIT 1', [pollId, user.id])
    if (!canViewResults(user, poll, (rowCount ?? 0) > 0)) throw problem(403, 'RESULTS_HIDDEN', 'ยังดูผลโหวตไม่ได้')

    const by = new URL(request.url).searchParams.get('breakdown') ?? 'none'
    if (by !== 'none' && by !== 'faculty' && by !== 'year') throw problem(400, 'BAD_REQUEST', 'breakdown ต้องเป็น none, faculty หรือ year')
    if (by !== 'none' && !staff) throw problem(403, 'FORBIDDEN', 'ดูผลแยกกลุ่มได้เฉพาะเจ้าของและแอดมิน')

    const results = await computeResults(poll, staff, by)
    // generatedAt เปลี่ยนทุกครั้ง จึงไม่เอาไปคิด ETag
    const etag = `"${createHash('sha1').update(JSON.stringify({ ...results, generatedAt: null })).digest('base64url')}"`
    if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } })
    return json(results, 200, { ETag: etag, 'Cache-Control': 'private, no-cache' })
})
