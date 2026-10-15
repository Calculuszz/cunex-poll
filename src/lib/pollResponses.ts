import { connection } from 'next/server'
import { pool } from '@/lib/db'
import type { InputItem } from '@/store/elementStore'
import { RESPONSES_PAGE_SIZE, type ResponsesPage } from '@/lib/responseTypes'

// คำตอบรายชุดแบบแบ่งหน้าที่ฐานข้อมูล ใหม่สุดก่อน
// withIdentity = ส่งรหัสผู้ตอบด้วย ผู้เรียกต้องตรวจว่าเป็นแอดมินก่อน (System flow §8 กรองที่ API ไม่ใช่ซ่อนที่ UI)
export async function getResponsesPage(pollId: string, page: number, withIdentity: boolean): Promise<ResponsesPage | null> {
    await connection()
    const { rowCount } = await pool.query('SELECT 1 FROM polls WHERE id = $1', [pollId])
    if (!rowCount) return null

    const pageSize = RESPONSES_PAGE_SIZE
    const [{ rows: totals }, { rows: responses }, { rows: items }] = await Promise.all([
        pool.query<{ n: number }>("SELECT count(*)::int AS n FROM poll_responses WHERE poll_id = $1 AND status = 'SUBMITTED'", [pollId]),
        pool.query<{ id: string; no: number; created_at: Date; respondent: string | null }>(
            `SELECT id, no, created_at, respondent FROM (
                SELECT id, created_at, respondent, row_number() OVER (ORDER BY created_at, id)::int AS no
                FROM poll_responses WHERE poll_id = $1 AND status = 'SUBMITTED'
             ) t ORDER BY no DESC LIMIT $2 OFFSET $3`,
            [pollId, pageSize, (page - 1) * pageSize],
        ),
        pool.query<{ position: number; data: InputItem }>(
            "SELECT position, data FROM poll_items WHERE poll_id = $1 AND data->>'kind' = 'input'",
            [pollId],
        ),
    ])

    const labels = new Map<string, string>()
    for (const { position, data } of items) {
        if (data.type !== 'text') for (const o of data.options) labels.set(`${position}:${o.id}`, o.label)
    }

    const ids = responses.map((r) => r.id)
    const { rows: answers } = ids.length === 0
        ? { rows: [] }
        : await pool.query<{ response_id: string; position: number; option_id: string | null; text_value: string | null }>(
            'SELECT response_id, position, option_id, text_value FROM poll_answers WHERE response_id = ANY($1) ORDER BY id',
            [ids],
        )

    return {
        total: totals[0].n,
        page,
        pageSize,
        identityVisible: withIdentity,
        rows: responses.map((r) => {
            const byPosition: Record<number, string[]> = {}
            for (const a of answers.filter((x) => String(x.response_id) === String(r.id))) {
                const value = a.text_value ?? labels.get(`${a.position}:${a.option_id}`) ?? ''
                ;(byPosition[a.position] ??= []).push(value)
            }
            return {
                no: r.no,
                submittedAt: r.created_at.toISOString(),
                respondent: withIdentity ? r.respondent : null,
                answers: byPosition,
            }
        }),
    }
}
