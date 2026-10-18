import { requireUser } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { appOrigin, json, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, ownedPoll, requireStatus, toDetail } from '@/mock-api/polls'

// เปิด/ปิดผลเรียลไทม์ ได้เฉพาะก่อนเริ่มโหวต
export const PATCH = route<{ pollId: string }>(async (request, { pollId }) => {
    const user = await requireUser()
    const { showResultsRealtime } = await readJson(request)
    if (typeof showResultsRealtime !== 'boolean') throw problem(400, 'BAD_REQUEST', 'showResultsRealtime ต้องเป็น boolean')
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['pending_review', 'approved'], 'เปลี่ยนได้เฉพาะก่อนเปิดโหวต')
    await db.query(
        `UPDATE polls SET settings = settings || jsonb_build_object('showResultsRealtime', $2::boolean), updated_at = now() WHERE id = $1`,
        [pollId, showResultsRealtime],
    )
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})
