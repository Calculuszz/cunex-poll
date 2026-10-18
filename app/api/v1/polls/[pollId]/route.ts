import { audit, requireUser } from '@/mock-api/auth'
import { db, tx } from '@/mock-api/db'
import { appOrigin, json, noContent, problem, readJson, route } from '@/mock-api/http'
import { loadPoll, ownedPoll, parseDraft, requireStatus, toDetail, visiblePoll, writeDraft } from '@/mock-api/polls'

type P = { pollId: string }

export const GET = route<P>(async (request, { pollId }) => {
    const user = await requireUser()
    const poll = await visiblePoll(pollId, user)
    return json(await toDetail(poll, user, appOrigin(request)))
})

// เขียนทับฉบับร่างทั้งก้อน ต้องส่ง If-Match: <version> กันบันทึกทับของที่ใหม่กว่า
export const PUT = route<P>(async (request, { pollId }) => {
    const user = await requireUser()
    const ifMatch = request.headers.get('if-match')
    if (!ifMatch) throw problem(428, 'PRECONDITION_REQUIRED', 'ต้องส่ง If-Match: <version>')
    const draft = await parseDraft(await readJson(request))
    await tx(async (client) => {
        const poll = await ownedPoll(pollId, user, client)
        requireStatus(poll, ['draft', 'rejected'], 'แก้ได้เฉพาะฉบับร่างหรือโพลที่ถูกปฏิเสธ')
        if (Number(ifMatch.replaceAll('"', '')) !== poll.version) {
            throw problem(412, 'VERSION_CONFLICT', 'ฉบับร่างถูกแก้จากที่อื่นแล้ว', { currentVersion: poll.version })
        }
        await writeDraft(client, pollId, draft)
        await client.query('UPDATE polls SET version = version + 1 WHERE id = $1', [pollId])
    })
    return json(await toDetail((await loadPoll(pollId))!, user, appOrigin(request)))
})

// ลบแบบ soft delete ได้เฉพาะฉบับร่าง/โพลที่ถูกปฏิเสธ
export const DELETE = route<P>(async (_request, { pollId }) => {
    const user = await requireUser()
    const poll = await ownedPoll(pollId, user)
    requireStatus(poll, ['draft', 'rejected'], 'ลบได้เฉพาะฉบับร่างหรือโพลที่ถูกปฏิเสธ')
    await db.query('UPDATE polls SET deleted_at = now() WHERE id = $1', [pollId])
    await audit(user.id, 'poll.delete', 'poll', pollId)
    return noContent()
})
