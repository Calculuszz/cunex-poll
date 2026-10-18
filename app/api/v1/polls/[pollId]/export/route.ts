import { requireUser } from '@/mock-api/auth'
import { problem, route } from '@/mock-api/http'
import { isStaff, loadElements, requireStatus, visiblePoll } from '@/mock-api/polls'
import { canSeeIdentity, exportCsv } from '@/mock-api/responses'

// [เสนอเพิ่ม] ส่งออกคำตอบรายชุดเป็น CSV (text/csv ไม่ใช่ JSON) · คอลัมน์ผู้ตอบตามสิทธิ์เดียวกับคำตอบรายชุด
export const GET = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    if (!isStaff(user, poll)) throw problem(403, 'FORBIDDEN', 'เฉพาะเจ้าของโพลและแอดมิน')
    requireStatus(poll, ['open', 'closed'], 'ส่งออกได้เฉพาะโพลที่เปิดโหวตแล้ว')
    const withIdentity = canSeeIdentity(user, poll, new URL(request.url).searchParams.get('withIdentity') === '1')
    const { csv, filename } = await exportCsv(poll, await loadElements(pollId), withIdentity)
    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Cache-Control': 'no-store',
        },
    })
})
