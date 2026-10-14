import { connection } from 'next/server'
import { pool } from '@/lib/db'
import type { InputItem } from '@/store/elementStore'
import {
    TEXT_PREVIEW_LIMIT,
    type PollResults,
    type ResultQuestion,
    type ResultQuestionType,
    type TextAnswer,
} from '@/lib/pollResultTypes'

const TYPE_MAP: Record<InputItem['type'], ResultQuestionType> = {
    radio: 'single_choice',
    select: 'single_choice',
    checkbox: 'multi_choice',
    text: 'text',
}

type TextRow = { id: string; position: number; text_value: string; created_at: Date }

const toTextAnswer = (row: TextRow): TextAnswer => ({
    id: String(row.id),
    text: row.text_value,
    createdAt: row.created_at.toISOString(),
})

// รวมผลโหวตทุกข้อของโพล คืน null ถ้าไม่มีโพลนี้
export async function getPollResults(pollId: string): Promise<PollResults | null> {
    await connection()
    const { rows: polls } = await pool.query<{ type: PollResults['status']; close_at: Date }>(
        'SELECT type, close_at FROM polls WHERE id = $1',
        [pollId],
    )
    if (polls.length === 0) return null

    // ไม่ขึ้นต่อกัน ยิงพร้อมกันได้
    const [items, total, respondents, optionCounts, latestTexts] = await Promise.all([
        pool.query<{ position: number; data: InputItem }>(
            `SELECT position, data FROM poll_items
             WHERE poll_id = $1 AND data->>'kind' = 'input' ORDER BY position`,
            [pollId],
        ),
        pool.query<{ n: number }>("SELECT count(*)::int AS n FROM poll_responses WHERE poll_id = $1 AND status = 'SUBMITTED'", [pollId]),
        pool.query<{ position: number; n: number }>(
            `SELECT a.position, count(DISTINCT a.response_id)::int AS n
             FROM poll_answers a JOIN poll_responses r ON r.id = a.response_id
             WHERE r.poll_id = $1 AND r.status = 'SUBMITTED' GROUP BY a.position`,
            [pollId],
        ),
        pool.query<{ position: number; option_id: string; n: number }>(
            `SELECT a.position, a.option_id, count(*)::int AS n
             FROM poll_answers a JOIN poll_responses r ON r.id = a.response_id
             WHERE r.poll_id = $1 AND r.status = 'SUBMITTED' AND a.option_id IS NOT NULL GROUP BY a.position, a.option_id`,
            [pollId],
        ),
        // limit ที่ฐานข้อมูล ข้อความโตตามจำนวนผู้ตอบ ไม่ดึงมาทั้งหมดแล้วตัดทีหลัง
        pool.query<TextRow>(
            `SELECT id, position, text_value, created_at FROM (
                SELECT a.id, a.position, a.text_value, r.created_at,
                       row_number() OVER (PARTITION BY a.position ORDER BY r.created_at DESC, a.id DESC) AS rn
                FROM poll_answers a JOIN poll_responses r ON r.id = a.response_id
                WHERE r.poll_id = $1 AND r.status = 'SUBMITTED' AND a.text_value IS NOT NULL
             ) t WHERE rn <= $2 ORDER BY position, rn`,
            [pollId, TEXT_PREVIEW_LIMIT],
        ),
    ])

    const respondentsAt = new Map(respondents.rows.map((r) => [r.position, r.n]))
    const countKey = (position: number, optionId: string) => `${position}:${optionId}`
    const counts = new Map(optionCounts.rows.map((r) => [countKey(r.position, r.option_id), r.n]))

    const questions = items.rows.map(({ position, data }, index): ResultQuestion => {
        const base = {
            position,
            order: index + 1,
            title: data.label,
            type: TYPE_MAP[data.type],
            respondentCount: respondentsAt.get(position) ?? 0,
        }
        if (data.type === 'text') {
            return {
                ...base,
                textAnswers: latestTexts.rows.filter((r) => r.position === position).map(toTextAnswer),
                // ข้อความหนึ่งแถวต่อผู้ตอบหนึ่งคน จำนวนคำตอบจึงเท่ากับจำนวนผู้ตอบข้อนี้
                textAnswerCount: base.respondentCount,
            }
        }
        return {
            ...base,
            options: data.options.map((o) => ({ id: o.id, label: o.label, count: counts.get(countKey(position, o.id)) ?? 0 })),
        }
    })

    return {
        pollId,
        status: polls[0].type,
        closeAt: polls[0].close_at.toISOString(),
        totalRespondents: total.rows[0].n,
        questions,
    }
}

// คำตอบข้อความทั้งหมดของข้อหนึ่ง ใหม่สุดก่อน มีเพดานกันโพลใหญ่ส่งข้อมูลก้อนโต
export const TEXT_ANSWER_MAX = 500

export async function getTextAnswers(pollId: string, position: number): Promise<TextAnswer[]> {
    const { rows } = await pool.query<TextRow>(
        `SELECT a.id, a.position, a.text_value, r.created_at
         FROM poll_answers a JOIN poll_responses r ON r.id = a.response_id
         WHERE r.poll_id = $1 AND r.status = 'SUBMITTED' AND a.position = $2 AND a.text_value IS NOT NULL
         ORDER BY r.created_at DESC, a.id DESC LIMIT $3`,
        [pollId, position, TEXT_ANSWER_MAX],
    )
    return rows.map(toTextAnswer)
}

const csvCell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

const bangkokStamp = (d: Date, withSeconds = false) =>
    d.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok', hour12: false }).slice(0, withSeconds ? 19 : 16)

export type PollExport = { filename: string; csv: string }

// CSV ตาม API contract §5.5: หนึ่งแถวต่อผู้ส่งหนึ่งคน หนึ่งคอลัมน์ต่อหนึ่งคำถาม
// ค่าเป็น label ของตัวเลือก (เลือกหลายข้อคั่นด้วย |) ข้อที่ไม่ได้ตอบเป็นเซลล์ว่าง เรียงตามเวลาส่ง
// ขึ้นต้นด้วย BOM ให้ Excel อ่านภาษาไทยถูก · export ได้เฉพาะ VOTING/DONE
export async function exportPollCsv(pollId: string): Promise<PollExport | 'not_found' | 'bad_state'> {
    const { rows: polls } = await pool.query<{ type: string }>('SELECT type FROM polls WHERE id = $1', [pollId])
    if (polls.length === 0) return 'not_found'
    const status = polls[0].type
    if (status !== 'VOTING' && status !== 'DONE') return 'bad_state'

    const [items, responses, answers] = await Promise.all([
        pool.query<{ position: number; data: InputItem }>(
            `SELECT position, data FROM poll_items
             WHERE poll_id = $1 AND data->>'kind' = 'input' ORDER BY position`,
            [pollId],
        ),
        pool.query<{ id: string; created_at: Date }>(
            "SELECT id, created_at FROM poll_responses WHERE poll_id = $1 AND status = 'SUBMITTED' ORDER BY created_at, id",
            [pollId],
        ),
        pool.query<{ response_id: string; position: number; option_id: string | null; text_value: string | null }>(
            `SELECT a.response_id, a.position, a.option_id, a.text_value
             FROM poll_answers a JOIN poll_responses r ON r.id = a.response_id
             WHERE r.poll_id = $1 AND r.status = 'SUBMITTED' ORDER BY a.id`,
            [pollId],
        ),
    ])

    const optionLabel = new Map<string, string>()
    for (const { position, data } of items.rows) {
        if (data.type !== 'text') for (const o of data.options) optionLabel.set(`${position}:${o.id}`, o.label)
    }
    // response → position → ค่าที่ตอบ (แบบเลือกหลายข้อมีหลายค่า)
    const cells = new Map<string, Map<number, string[]>>()
    for (const a of answers.rows) {
        const byPosition = cells.get(String(a.response_id)) ?? new Map<number, string[]>()
        const value = a.text_value ?? optionLabel.get(`${a.position}:${a.option_id}`) ?? ''
        byPosition.set(a.position, [...(byPosition.get(a.position) ?? []), value])
        cells.set(String(a.response_id), byPosition)
    }

    const header = ['ลำดับ', 'เวลาที่ส่ง', ...items.rows.map((i) => i.data.label)]
    const lines = responses.rows.map((r, index) => {
        const byPosition = cells.get(String(r.id))
        return [
            String(index + 1),
            bangkokStamp(r.created_at),
            ...items.rows.map((i) => (byPosition?.get(i.position) ?? []).join('|')),
        ]
    })
    const csv = '﻿' + [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')

    // เวลาที่ดึงอยู่ในชื่อไฟล์ และโพลที่ปิดแล้วต่อท้าย -final กันคนเอาไฟล์ระหว่างโหวตไปประกาศเป็นผลจริง
    const stamp = bangkokStamp(new Date()).replace(' ', '-').replace(':', '')
    return { filename: `poll-${pollId}-${stamp}${status === 'DONE' ? '-final' : ''}.csv`, csv }
}
