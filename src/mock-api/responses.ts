import 'server-only'
import type { Answer, Element, ResponseRow } from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'
import { db } from './db'
import { identifiesSender, type PollRow } from './polls'
import type { UserRow } from './auth'

// [เสนอเพิ่ม] เห็นรหัสผู้ตอบ: แอดมินเสมอ (เมื่อขอ) · เจ้าของเมื่อโพลเปิด "ระบุคนส่ง" · ตัดสินที่ server ไม่ใช่ flag จาก client
export const canSeeIdentity = (user: UserRow, poll: PollRow, requested: boolean) =>
    requested && (user.role === 'admin' || (poll.owner_id === user.id && identifiesSender(poll)))

type Row = { id: string; no: number; submitted_at: Date; respondent: string | null }

// คำตอบรายชุดเรียงตามเวลาส่ง ลำดับ no คงที่ (ส่งก่อน = เลขน้อย)
export async function responseRows(pollId: string, withIdentity: boolean, order: 'asc' | 'desc', limit?: number, offset = 0) {
    const { rows } = await db.query<Row>(
        `SELECT * FROM (
            SELECT b.id, b.submitted_at, u.student_id AS respondent,
                   row_number() OVER (ORDER BY b.submitted_at, b.id)::int AS no
            FROM ballots b LEFT JOIN users u ON u.id::text = b.voter_key
            WHERE b.poll_id = $1
         ) t ORDER BY no ${order === 'asc' ? 'ASC' : 'DESC'}
         ${limit !== undefined ? 'LIMIT $2 OFFSET $3' : ''}`,
        limit !== undefined ? [pollId, limit, offset] : [pollId],
    )
    const ids = rows.map((r) => r.id)
    const { rows: answers } = ids.length === 0 ? { rows: [] } : await db.query<{ ballot_id: string; element_id: string; option_id: string | null; text: string | null }>(
        'SELECT ballot_id, element_id, option_id, text FROM answers WHERE ballot_id = ANY($1)', [ids])
    return rows.map((r): ResponseRow => {
        const mine = answers.filter((a) => a.ballot_id === r.id)
        const grouped = new Map<string, Answer>()
        for (const a of mine) {
            if (a.text !== null) grouped.set(a.element_id, { elementId: a.element_id, text: a.text })
            else {
                const prev = grouped.get(a.element_id)
                grouped.set(a.element_id, { elementId: a.element_id, optionIds: [...(prev && 'optionIds' in prev ? prev.optionIds : []), a.option_id!] })
            }
        }
        return { no: r.no, submittedAt: r.submitted_at.toISOString(), respondent: withIdentity ? r.respondent : null, answers: [...grouped.values()] }
    })
}

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
const bangkok = (d: Date) => d.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok', hour12: false }).slice(0, 19)

// CSV: หนึ่งแถวต่อหนึ่ง ballot หนึ่งคอลัมน์ต่อหนึ่งคำถาม · เลือกหลายข้อคั่นด้วย | · ข้อที่ไม่ได้ตอบเป็นเซลล์ว่าง
// ขึ้นต้นด้วย BOM ให้ Excel อ่านไทยถูก · ชื่อไฟล์มีเวลาที่ดึง และ -final เมื่อปิดโหวตแล้ว
export async function exportCsv(poll: PollRow, elements: Element[], withIdentity: boolean) {
    const questions = elements.filter(isQuestion)
    const labelOf = new Map(questions.flatMap((q) => (isChoice(q) ? q.options.map((o) => [o.id!, o.label] as const) : [])))
    const rows = await responseRows(poll.id, withIdentity, 'asc')
    const header = ['ลำดับ', 'เวลาที่ส่ง', ...(withIdentity ? ['ผู้ตอบ'] : []), ...questions.map((q) => q.title ?? '')]
    const lines = rows.map((r) => [
        String(r.no),
        bangkok(new Date(r.submittedAt)),
        ...(withIdentity ? [r.respondent ?? ''] : []),
        ...questions.map((q) => {
            const a = r.answers.find((x) => x.elementId === q.id)
            if (!a) return ''
            return 'text' in a ? a.text : a.optionIds.map((id) => labelOf.get(id) ?? '').join('|')
        }),
    ])
    const csv = '﻿' + [header, ...lines].map((l) => l.map(csvCell).join(',')).join('\r\n')
    const stamp = bangkok(new Date()).replace(' ', '-').replaceAll(':', '').slice(0, 15)
    return { csv, filename: `poll-${poll.id}-${stamp}${poll.status === 'closed' ? '-final' : ''}.csv` }
}
