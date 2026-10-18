import 'server-only'
import type { PoolClient } from 'pg'
import type { Answer, Ballot, Element } from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'
import { problem } from './http'

// ตรวจคำตอบทั้งชุด คืนทุกปัญหาในครั้งเดียว · คำตอบว่างหรือไม่ส่งมา = ไม่ได้ตอบ
export function validateAnswers(elements: Element[], raw: unknown): Answer[] {
    if (!Array.isArray(raw)) throw problem(400, 'BAD_REQUEST', 'answers ต้องเป็น array')
    const problems: { path: string; message: string }[] = []
    const byId = new Map(elements.filter(isQuestion).map((e) => [e.id!, e]))
    const answers: Answer[] = []

    raw.forEach((a, i) => {
        const path = `answers[${i}]`
        if (typeof a !== 'object' || a === null) return problems.push({ path, message: 'ต้องเป็น object' })
        const { elementId, optionIds, text } = a as Record<string, unknown>
        const element = typeof elementId === 'string' ? byId.get(elementId) : undefined
        if (!element) return problems.push({ path: `${path}.elementId`, message: 'ไม่มีคำถามนี้ในโพล' })
        if (answers.some((x) => x.elementId === elementId)) return problems.push({ path, message: 'ตอบข้อเดียวกันซ้ำ' })

        if (element.type === 'text_question') {
            if (typeof text !== 'string') return problems.push({ path: `${path}.text`, message: 'ต้องเป็นข้อความ' })
            const value = text.trim()
            const max = element.config.maxLength ?? 5000
            if (value.length > max) return problems.push({ path: `${path}.text`, message: `ยาวเกิน ${max} ตัวอักษร` })
            if (value) answers.push({ elementId: element.id!, text: value })
            return
        }
        if (!isChoice(element)) return
        if (!Array.isArray(optionIds) || !optionIds.every((o) => typeof o === 'string')) {
            return problems.push({ path: `${path}.optionIds`, message: 'ต้องเป็น array ของ id ตัวเลือก' })
        }
        const ids = [...new Set(optionIds as string[])]
        if (ids.some((o) => !element.options.some((opt) => opt.id === o))) {
            return problems.push({ path: `${path}.optionIds`, message: 'มีตัวเลือกที่ไม่อยู่ในคำถามนี้' })
        }
        if (element.type !== 'multi_choice' && ids.length > 1) return problems.push({ path: `${path}.optionIds`, message: 'เลือกได้ข้อเดียว' })
        if (element.type === 'multi_choice' && ids.length > 0) {
            const { minSelect, maxSelect } = element.config
            if (minSelect != null && ids.length < minSelect) return problems.push({ path: `${path}.optionIds`, message: `เลือกอย่างน้อย ${minSelect} ข้อ` })
            if (maxSelect != null && ids.length > maxSelect) return problems.push({ path: `${path}.optionIds`, message: `เลือกได้ไม่เกิน ${maxSelect} ข้อ` })
        }
        if (ids.length > 0) answers.push({ elementId: element.id!, optionIds: ids })
    })

    elements.forEach((e, i) => {
        if (isQuestion(e) && e.isRequired && !answers.some((a) => a.elementId === e.id)) {
            problems.push({ path: `elements[${i}]`, message: 'ข้อนี้ต้องตอบ' })
        }
    })
    if (problems.length > 0) throw problem(422, 'INVALID_ANSWERS', 'คำตอบไม่ครบหรือไม่ถูกต้อง', { problems })
    return answers
}

// เวลาส่งตัดเหลือระดับนาที (สัญญาบอก minute precision) · โพลที่ลงคะแนนซ้ำได้คืน ballot ล่าสุด
const toMinute = (d: Date) => new Date(Math.floor(d.getTime() / 60_000) * 60_000).toISOString()

export async function readBallot(client: PoolClient | { query: PoolClient['query'] }, pollId: string, voterKey: string): Promise<Ballot | null> {
    const { rows } = await client.query<{ id: string; submitted_at: Date }>(
        'SELECT id, submitted_at FROM ballots WHERE poll_id = $1 AND voter_key = $2 ORDER BY submitted_at DESC LIMIT 1', [pollId, voterKey])
    if (rows.length === 0) return null
    const { rows: answers } = await client.query<{ element_id: string; option_id: string | null; text: string | null }>(
        'SELECT element_id, option_id, text FROM answers WHERE ballot_id = $1', [rows[0].id])
    const grouped = new Map<string, Answer>()
    for (const a of answers) {
        if (a.text !== null) grouped.set(a.element_id, { elementId: a.element_id, text: a.text })
        else {
            const prev = grouped.get(a.element_id)
            const ids = prev && 'optionIds' in prev ? prev.optionIds : []
            grouped.set(a.element_id, { elementId: a.element_id, optionIds: [...ids, a.option_id!] })
        }
    }
    return { answers: [...grouped.values()], submittedAt: toMinute(rows[0].submitted_at) }
}

// clientToken ส่งมา = ballot ใหม่ของโพลที่ลงคะแนนซ้ำได้ · ไม่ส่ง = upsert ballot เดียวของคนนั้น
export async function writeBallot(client: PoolClient, pollId: string, voterKey: string, answers: Answer[], clientToken?: string) {
    let ballotId: string
    const { rows: existing } = clientToken
        ? { rows: [] as { id: string }[] }
        : await client.query<{ id: string }>('SELECT id FROM ballots WHERE poll_id = $1 AND voter_key = $2 LIMIT 1', [pollId, voterKey])
    if (existing.length > 0) {
        ballotId = existing[0].id
        await client.query('UPDATE ballots SET submitted_at = now() WHERE id = $1', [ballotId])
    } else {
        const { rows } = await client.query<{ id: string }>(
            'INSERT INTO ballots (poll_id, voter_key, client_token) VALUES ($1, $2, $3) RETURNING id',
            [pollId, voterKey, clientToken ?? null],
        )
        ballotId = rows[0].id
    }
    await client.query('DELETE FROM answers WHERE ballot_id = $1', [ballotId])
    for (const a of answers) {
        if ('text' in a) {
            await client.query('INSERT INTO answers (ballot_id, element_id, text) VALUES ($1, $2, $3)', [ballotId, a.elementId, a.text])
        } else {
            for (const optionId of a.optionIds) {
                await client.query('INSERT INTO answers (ballot_id, element_id, option_id) VALUES ($1, $2, $3)', [ballotId, a.elementId, optionId])
            }
        }
    }
}
