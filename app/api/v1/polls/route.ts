import { requireUser } from '@/mock-api/auth'
import { db, tx } from '@/mock-api/db'
import { appOrigin, json, pageParams, problem, readJson, route, toPage } from '@/mock-api/http'
import {
    DEFAULT_SETTINGS, SUMMARY_SQL, isAcceptingVotes, isEligible, loadPoll, parseDraft, settingsOf, sweepExpired, toDetail, toSummary, writeDraft,
    type PollRow,
} from '@/mock-api/polls'

// หน้ารวมโพล: listedPublicly และผู้เรียกมีสิทธิ์ตอบ แนบสถานะ ballot ของตัวเองมาด้วย
export const GET = route(async (request) => {
    const user = await requireUser()
    await sweepExpired()
    const { url, limit, offset } = pageParams(request)
    const status = url.searchParams.get('status') ?? 'open'
    if (status !== 'open' && status !== 'closed') throw problem(400, 'BAD_REQUEST', 'status ต้องเป็น open หรือ closed')

    // กรองสิทธิ์ตามกลุ่มผู้ตอบหลังดึง (mock) · ของจริงกรองใน SQL
    const { rows } = await db.query<PollRow & { question_count: number; submitted: boolean; has_draft: boolean }>(
        `SELECT * FROM (${SUMMARY_SQL}) p
         CROSS JOIN LATERAL (SELECT EXISTS (SELECT 1 FROM ballots b WHERE b.poll_id = p.id AND b.voter_key = $2) AS submitted,
                                    EXISTS (SELECT 1 FROM ballot_drafts d WHERE d.poll_id = p.id AND d.voter_key = $2) AS has_draft) s
         WHERE p.deleted_at IS NULL AND NOT p.taken_down AND p.status = $1 AND (p.settings->>'listedPublicly')::boolean
         ORDER BY ${status === 'open' ? 'p.closes_at ASC' : 'p.closed_at DESC'}, p.id`,
        [status, user.id],
    )
    const eligible = rows.filter((r) => isEligible(user, r.audience))
    const page = toPage(eligible.slice(offset, offset + limit + 1), limit, offset)
    return json({
        items: page.items.map((r) => ({
            ...toSummary(r),
            myBallot: { submitted: r.submitted, canEdit: r.submitted && settingsOf(r).allowAnswerEdit && isAcceptingVotes(r), hasDraft: r.has_draft },
        })),
        nextCursor: page.nextCursor,
    })
})

// สร้างฉบับร่าง ทุกช่องไม่บังคับ
export const POST = route(async (request) => {
    const user = await requireUser()
    const draft = await parseDraft(await readJson(request))
    const id = await tx(async (client) => {
        const { rows } = await client.query<{ id: string }>(
            `INSERT INTO polls (owner_id, settings) VALUES ($1, $2) RETURNING id`,
            [user.id, JSON.stringify(DEFAULT_SETTINGS)],
        )
        await writeDraft(client, rows[0].id, draft)
        return rows[0].id
    })
    return json(await toDetail((await loadPoll(id))!, user, appOrigin(request)), 201)
})
