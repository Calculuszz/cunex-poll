import { audit, requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { isRealImage } from '@/mock-api/images'
import { appOrigin, json, problem, route } from '@/mock-api/http'
import { completenessProblems, imageUrls, loadElements, loadPoll, ownedPoll, requireStatus, toDetail } from '@/mock-api/polls'

// ตรวจความครบแล้วส่งขออนุมัติ → pending_review · ไม่ครบตอบ 422 พร้อมรายการปัญหาทั้งหมด
export const POST = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['draft', 'rejected'], 'ส่งขออนุมัติได้เฉพาะฉบับร่างหรือโพลที่ถูกปฏิเสธ')
    const elements = await loadElements(pollId)
    const problems = completenessProblems(poll, elements)
    for (const { path, url } of imageUrls({ coverImageUrl: poll.cover_image_url, elements })) {
        if (!(await isRealImage(url))) problems.push({ path, message: 'ไม่พบไฟล์รูป หรือไฟล์ไม่ใช่ JPEG/PNG/WebP' })
    }
    if (problems.length > 0) throw problem(422, 'POLL_INCOMPLETE', 'โพลยังไม่ครบ', { problems })

    await db.query(`UPDATE polls SET status = 'pending_review', submitted_at = now(), updated_at = now() WHERE id = $1`, [pollId])
    await audit(user.id, 'poll.submit', 'poll', pollId)
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})
