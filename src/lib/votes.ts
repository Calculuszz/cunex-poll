import { connection } from 'next/server'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { getPollDetail } from '@/lib/polls'
import { audienceLabel } from '@/lib/audienceLabel'
import {
    canRepeat,
    firstMissingRequired,
    isOpenForVoting,
    itemKey,
    normalizeAnswers,
    questionsOf,
    type Answers,
    type IneligibleReason,
    type MyResponse,
    type VoteItem,
    type VoterPoll,
} from '@/lib/voteForm'
import type { ElementItem, InputItem } from '@/store/elementStore'

// ── โพลสำหรับหน้ากรอก ──

export async function getVoterPoll(id: string): Promise<VoterPoll | null> {
    const poll = await getPollDetail(id)
    if (!poll) return null
    // โพลที่ยังไม่เคยเปิดโหวตไม่ส่งคำถามออกไป (API contract §3 · closed: true)
    const visible = poll.type === 'VOTING' || poll.type === 'DONE'
    const items: VoteItem[] = visible
        ? poll.items.map((row) => {
            const data = row.data as unknown as InputItem | ElementItem
            return { ...data, key: itemKey(poll.id, row.position, data.id), position: row.position }
        })
        : []
    return {
        id: poll.id,
        title: poll.title,
        description: poll.desc,
        scope: poll.scope,
        status: poll.type,
        realtime: poll.realtime,
        allowRepeat: poll.allowRepeat,
        closeAt: new Date(poll.closeTime).toISOString(),
        audienceLabel: audienceLabel(poll),
        items,
        questionCount: poll.items.filter((row) => row.data.kind === 'input').length,
        resultsPublished: poll.resultDisplay.published,
        // studentCodes ใช้ตรวจสิทธิ์ภายใน ไม่ส่งออกไปหน้ากรอก
    }
}

// รหัสที่ได้สิทธิ์ของโพลแบบ D (เก็บแยกจาก VoterPoll เพราะห้ามหลุดไปฝั่ง client)
async function allowedCodes(pollId: string): Promise<string[]> {
    const { rows } = await pool.query<{ codes: string[] | null }>(
        `SELECT ARRAY(SELECT jsonb_array_elements_text(audience->'studentCodes')) AS codes FROM polls WHERE id = $1`,
        [pollId],
    )
    return rows[0]?.codes ?? []
}

// ── คำตอบของผู้ใช้ ──

type ResponseRow = { id: string; status: 'DRAFT' | 'SUBMITTED'; updated_at: Date; created_at: Date }

async function readAnswers(db: PoolClient | typeof pool, poll: VoterPoll, responseId: string): Promise<Answers> {
    const { rows } = await db.query<{ position: number; option_id: string | null; text_value: string | null }>(
        'SELECT position, option_id, text_value FROM poll_answers WHERE response_id = $1 ORDER BY id',
        [responseId],
    )
    const answers: Answers = {}
    for (const question of questionsOf(poll.items)) {
        const mine = rows.filter((r) => r.position === question.position)
        if (mine.length === 0) continue
        if (question.type === 'text') answers[question.key] = mine[0].text_value ?? ''
        else if (question.type === 'checkbox') answers[question.key] = mine.map((r) => r.option_id ?? '')
        else answers[question.key] = mine[0].option_id ?? ''
    }
    return answers
}

async function writeAnswers(client: PoolClient, poll: VoterPoll, responseId: string, answers: Answers) {
    await client.query('DELETE FROM poll_answers WHERE response_id = $1', [responseId])
    for (const question of questionsOf(poll.items)) {
        const value = answers[question.key]
        if (value === undefined) continue
        if (question.type === 'text') {
            await client.query(
                'INSERT INTO poll_answers (response_id, position, text_value) VALUES ($1, $2, $3)',
                [responseId, question.position, value],
            )
            continue
        }
        for (const optionId of Array.isArray(value) ? value : [value]) {
            await client.query(
                'INSERT INTO poll_answers (response_id, position, option_id) VALUES ($1, $2, $3)',
                [responseId, question.position, optionId],
            )
        }
    }
}

async function findResponses(pollId: string, respondent: string) {
    const { rows } = await pool.query<ResponseRow>(
        `SELECT id, status, updated_at, created_at FROM poll_responses
         WHERE poll_id = $1 AND respondent = $2 ORDER BY created_at DESC`,
        [pollId, respondent],
    )
    return {
        draft: rows.find((r) => r.status === 'DRAFT') ?? null,
        lastSubmitted: rows.find((r) => r.status === 'SUBMITTED') ?? null,
    }
}

export async function getMyResponse(poll: VoterPoll, respondent: string): Promise<MyResponse> {
    await connection()
    const { draft, lastSubmitted } = await findResponses(poll.id, respondent)
    const submittedAt = lastSubmitted?.created_at.toISOString() ?? null
    if (draft) {
        return { status: 'draft', answers: await readAnswers(pool, poll, draft.id), lastSavedAt: draft.updated_at.toISOString(), submittedAt }
    }
    if (lastSubmitted) {
        return { status: 'submitted', answers: await readAnswers(pool, poll, lastSubmitted.id), lastSavedAt: null, submittedAt }
    }
    return { status: 'none', answers: {}, lastSavedAt: null, submittedAt: null }
}

// ── สิทธิ์โหวต (API contract §4 eligibility) ──
// เป็นแค่ UX ให้บอกเหตุผลก่อนกรอก การตรวจจริงเกิดซ้ำทุกครั้งที่บันทึก/ส่ง

export async function checkEligibility(poll: VoterPoll, respondent: string, hasSubmitted: boolean): Promise<IneligibleReason | null> {
    if (poll.status !== 'VOTING' && poll.status !== 'DONE') return 'NOT_OPEN'
    if (!isOpenForVoting(poll)) return 'CLOSED'
    if (poll.scope === 'D' && !(await allowedCodes(poll.id)).includes(respondent)) return 'OUT_OF_SCOPE'
    // แบบ B ยังตรวจคณะไม่ได้เพราะยังไม่มีข้อมูลคณะของผู้ใช้จาก SSO จึงปล่อยผ่านไปก่อน
    if (hasSubmitted && !canRepeat(poll)) return 'ALREADY_VOTED'
    return null
}

const REASON_MESSAGE: Record<IneligibleReason, string> = {
    NOT_OPEN: 'โพลนี้ยังไม่เปิดให้ตอบ',
    CLOSED: 'โพลนี้ปิดรับคำตอบแล้ว',
    OUT_OF_SCOPE: 'คุณไม่อยู่ในกลุ่มผู้ตอบของโพลนี้',
    ALREADY_VOTED: 'คุณส่งคำตอบโพลนี้ไปแล้ว',
}

export type VoteResult<T> = { ok: true; value: T } | { ok: false; status: number; code: string; error: string }

const fail = (status: number, code: string, error: string) => ({ ok: false as const, status, code, error })
const ineligible = (reason: IneligibleReason) =>
    fail(reason === 'OUT_OF_SCOPE' ? 403 : 409, reason, REASON_MESSAGE[reason])

// บันทึกฉบับร่าง (สร้างใหม่ถ้ายังไม่มี) ใช้ทั้งตอนกดเริ่มโหวตและตอนเปลี่ยนหน้า
export async function saveDraft(pollId: string, respondent: string, rawAnswers: unknown): Promise<VoteResult<{ lastSavedAt: string }>> {
    const poll = await getVoterPoll(pollId)
    if (!poll) return fail(404, 'NOT_FOUND', 'ไม่พบโพล')
    const parsed = normalizeAnswers(questionsOf(poll.items), rawAnswers)
    if (!parsed.ok) return fail(400, 'BAD_REQUEST', parsed.error)

    const { lastSubmitted } = await findResponses(pollId, respondent)
    const reason = await checkEligibility(poll, respondent, lastSubmitted !== null)
    if (reason) return ineligible(reason)

    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const { rows } = await client.query<{ id: string; updated_at: Date }>(
            `INSERT INTO poll_responses (poll_id, respondent, status) VALUES ($1, $2, 'DRAFT')
             ON CONFLICT (poll_id, respondent) WHERE status = 'DRAFT' DO UPDATE SET updated_at = now()
             RETURNING id, updated_at`,
            [pollId, respondent],
        )
        await writeAnswers(client, poll, rows[0].id, parsed.value)
        await client.query('COMMIT')
        return { ok: true, value: { lastSavedAt: rows[0].updated_at.toISOString() } }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

// ส่งคำตอบ: ตรวจสิทธิ์ ข้อบังคับ และกันส่งซ้ำ แล้วเปลี่ยนฉบับร่างเป็นคำตอบที่ส่งแล้ว (ไม่มีร่างก็สร้างใหม่)
// clientToken เดิมส่งซ้ำ = ได้ผลเดิม ไม่นับคะแนนเพิ่ม
export async function submitVote(pollId: string, respondent: string, rawAnswers: unknown, clientToken: string): Promise<VoteResult<{ submittedAt: string }>> {
    const poll = await getVoterPoll(pollId)
    if (!poll) return fail(404, 'NOT_FOUND', 'ไม่พบโพล')
    const questions = questionsOf(poll.items)
    const parsed = normalizeAnswers(questions, rawAnswers)
    if (!parsed.ok) return fail(400, 'BAD_REQUEST', parsed.error)
    const missing = firstMissingRequired(questions, parsed.value)
    if (missing) return fail(400, 'REQUIRED', `ยังไม่ได้ตอบข้อ ${missing.order} ซึ่งต้องตอบ`)

    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        // ล็อกแถวโพลกันสองคำขอของคนเดียวกันส่งพร้อมกันแล้วหลุดกฎห้ามโหวตซ้ำ และกันเจ้าของกดปิดโพลระหว่างนั้น
        const { rows: locked } = await client.query<{ type: string; close_at: Date }>(
            'SELECT type, close_at FROM polls WHERE id = $1 FOR UPDATE',
            [pollId],
        )
        const current = { ...poll, status: locked[0].type as VoterPoll['status'], closeAt: locked[0].close_at.toISOString() }

        const { rows: same } = await client.query<{ created_at: Date }>(
            "SELECT created_at FROM poll_responses WHERE poll_id = $1 AND client_token = $2 AND status = 'SUBMITTED'",
            [pollId, clientToken],
        )
        if (same.length > 0) {
            await client.query('COMMIT')
            return { ok: true, value: { submittedAt: same[0].created_at.toISOString() } }
        }

        const { rows: submitted } = await client.query(
            "SELECT 1 FROM poll_responses WHERE poll_id = $1 AND respondent = $2 AND status = 'SUBMITTED' LIMIT 1",
            [pollId, respondent],
        )
        const reason = await checkEligibility(current, respondent, submitted.length > 0)
        if (reason) {
            await client.query('ROLLBACK')
            return ineligible(reason)
        }

        // created_at ของคำตอบที่ส่งแล้ว = เวลาที่ส่ง (ใช้เรียงใน export และแสดง "ส่งเมื่อ")
        const { rows: drafted } = await client.query<{ id: string; created_at: Date }>(
            `UPDATE poll_responses SET status = 'SUBMITTED', created_at = now(), updated_at = now(), client_token = $3
             WHERE poll_id = $1 AND respondent = $2 AND status = 'DRAFT'
             RETURNING id, created_at`,
            [pollId, respondent, clientToken],
        )
        const response = drafted[0] ?? (await client.query<{ id: string; created_at: Date }>(
            `INSERT INTO poll_responses (poll_id, respondent, status, client_token) VALUES ($1, $2, 'SUBMITTED', $3)
             RETURNING id, created_at`,
            [pollId, respondent, clientToken],
        )).rows[0]
        await writeAnswers(client, poll, response.id, parsed.value)
        await client.query('COMMIT')
        return { ok: true, value: { submittedAt: response.created_at.toISOString() } }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

// ผู้ตอบดูผลได้เมื่อเจ้าของเผยแพร่ผล และ (โพลปิดแล้ว หรือระหว่างเปิดโหวตถ้าโพลเปิด realtime และตัวเองส่งคำตอบแล้ว)
export function canViewResults(poll: VoterPoll, me: MyResponse) {
    if (!poll.resultsPublished) return false
    const closed = poll.status === 'DONE' || (poll.status === 'VOTING' && !isOpenForVoting(poll))
    if (closed) return true
    return poll.status === 'VOTING' && poll.realtime && me.submittedAt !== null
}

// คำตอบที่ส่งครั้งล่าสุดของผู้ใช้ (หน้าดูคำตอบของคุณ) ไม่เอาฉบับร่างรอบใหม่ของโพลที่ตอบซ้ำได้
export async function getMyLastSubmission(poll: VoterPoll, respondent: string): Promise<{ answers: Answers; submittedAt: string } | null> {
    await connection()
    const { lastSubmitted } = await findResponses(poll.id, respondent)
    if (!lastSubmitted) return null
    return { answers: await readAnswers(pool, poll, lastSubmitted.id), submittedAt: lastSubmitted.created_at.toISOString() }
}

export type ExploreVoteState = {
    published: boolean
    hasDraft: boolean
    hasSubmitted: boolean
    repeat: boolean
    canSeeResults: boolean
}

// สถานะการตอบของผู้ใช้ในทุกโพลที่กำลังเปิดโหวต ดึงทีเดียวด้วย query เดียวแทนการถามทีละโพลในหน้ารวมโพล
export async function getExploreVoteStates(respondent: string): Promise<Map<string, ExploreVoteState>> {
    await connection()
    const { rows } = await pool.query<{
        id: string; scope: string; allow_repeat: boolean; realtime: boolean; closed: boolean; published: boolean; draft: boolean; submitted: boolean
    }>(
        `SELECT p.id, p.scope, p.allow_repeat, p.realtime, p.close_at <= now() AS closed,
                coalesce((p.result_display->>'published')::boolean, true) AS published,
                coalesce(bool_or(r.status = 'DRAFT'), false) AS draft,
                coalesce(bool_or(r.status = 'SUBMITTED'), false) AS submitted
         FROM polls p LEFT JOIN poll_responses r ON r.poll_id = p.id AND r.respondent = $1
         WHERE p.type = 'VOTING'
         GROUP BY p.id`,
        [respondent],
    )
    return new Map(rows.map((r) => [r.id, {
        published: r.published,
        hasDraft: r.draft,
        hasSubmitted: r.submitted,
        repeat: r.scope === 'C' || r.allow_repeat,
        // กติกาเดียวกับ canViewResults: เผยแพร่ผลอยู่ และ (เลยเวลาปิดแล้ว หรือเปิด realtime และตัวเองส่งแล้ว)
        canSeeResults: r.published && (r.closed || (r.realtime && r.submitted)),
    }]))
}
