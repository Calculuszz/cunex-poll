import 'server-only'
import type { Breakdown, Element, ElementResult, PollResults } from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'
import { db } from './db'
import { loadElements, resultDisplayOf, type PollRow } from './polls'

export const MIN_GROUP_SIZE = Number(process.env.RESULTS_MIN_GROUP_SIZE ?? 5)

const round1 = (n: number) => Math.round(n * 10) / 10

// staff = เจ้าของ/แอดมิน เห็นทุกข้อทุกตัวเลข · ผู้ตอบเห็นเฉพาะข้อแบบเลือกที่เผยแพร่ และตัวเลขที่ซ่อนเป็น null
export async function computeResults(poll: PollRow, staff: boolean, breakdownBy: 'none' | 'faculty' | 'year'): Promise<PollResults> {
    const elements = await loadElements(poll.id)
    const [{ rows: totals }, { rows: answered }, { rows: counts }] = await Promise.all([
        db.query<{ n: number }>('SELECT count(*)::int AS n FROM ballots WHERE poll_id = $1', [poll.id]),
        db.query<{ element_id: string; n: number }>(
            `SELECT a.element_id, count(DISTINCT a.ballot_id)::int AS n FROM answers a JOIN ballots b ON b.id = a.ballot_id
             WHERE b.poll_id = $1 GROUP BY a.element_id`, [poll.id]),
        db.query<{ option_id: string; n: number }>(
            `SELECT a.option_id, count(*)::int AS n FROM answers a JOIN ballots b ON b.id = a.ballot_id
             WHERE b.poll_id = $1 AND a.option_id IS NOT NULL GROUP BY a.option_id`, [poll.id]),
    ])
    const answeredOf = new Map(answered.map((r) => [r.element_id, r.n]))
    const countOf = new Map(counts.map((r) => [r.option_id, r.n]))

    const display = resultDisplayOf(poll)
    const visible = elements.filter((e) => {
        if (!isQuestion(e)) return false
        if (staff) return true
        return isChoice(e) && (display.elementIds === null || display.elementIds.includes(e.id!))
    })

    const result: PollResults = {
        totalBallots: staff || display.showTotal ? totals[0].n : null,
        generatedAt: new Date().toISOString(),
        elements: visible.map((e): ElementResult => {
            const n = answeredOf.get(e.id!) ?? 0
            const answeredValue = staff || display.showTotal ? n : null
            if (!isChoice(e)) return { elementId: e.id!, type: 'text_question', answered: answeredValue }
            const raw = e.options.map((o) => ({ optionId: o.id!, count: countOf.get(o.id!) ?? 0 }))
            const top = Math.max(0, ...raw.map((o) => o.count))
            return {
                elementId: e.id!,
                type: e.type,
                answered: answeredValue,
                options: raw.map((o) => ({
                    optionId: o.optionId,
                    count: staff || display.showCount ? o.count : null,
                    percent: staff || display.showPercent ? (n === 0 ? 0 : round1((o.count / n) * 100)) : null,
                    weight: top === 0 ? 0 : o.count / top,
                })),
            }
        }),
    }
    if (staff && breakdownBy !== 'none') result.breakdown = await computeBreakdown(poll.id, elements, breakdownBy)
    return result
}

// แยกผลตามคณะ/ปีเข้า กลุ่มที่เล็กกว่า MIN_GROUP_SIZE รวมเป็น other ถ้ายังเล็กอยู่ซ่อนตัวเลข (กันระบุตัวคนตอบ)
async function computeBreakdown(pollId: string, elements: Element[], by: 'faculty' | 'year'): Promise<Breakdown> {
    const groupExpr = by === 'faculty' ? `coalesce(u.faculty_code, 'unknown')` : `coalesce(u.student_year::text, 'unknown')`
    const [{ rows: totals }, { rows: counts }] = await Promise.all([
        db.query<{ g: string; n: number }>(
            `SELECT ${groupExpr} AS g, count(*)::int AS n FROM ballots b LEFT JOIN users u ON u.id::text = b.voter_key
             WHERE b.poll_id = $1 GROUP BY 1`, [pollId]),
        db.query<{ g: string; element_id: string; option_id: string; n: number }>(
            `SELECT ${groupExpr} AS g, a.element_id, a.option_id, count(*)::int AS n
             FROM answers a JOIN ballots b ON b.id = a.ballot_id LEFT JOIN users u ON u.id::text = b.voter_key
             WHERE b.poll_id = $1 AND a.option_id IS NOT NULL GROUP BY 1, 2, 3`, [pollId]),
    ])
    const small = new Set(totals.filter((t) => t.g !== 'unknown' && t.n < MIN_GROUP_SIZE).map((t) => t.g))
    const groupOf = (g: string) => (small.has(g) ? 'other' : g)
    const merged = new Map<string, number>()
    for (const t of totals) merged.set(groupOf(t.g), (merged.get(groupOf(t.g)) ?? 0) + t.n)

    const choices = elements.filter(isChoice)
    const groups: Breakdown['groups'] = [...merged.entries()].map(([group, total]) => {
        if (total < MIN_GROUP_SIZE) return { group, hidden: true as const }
        return {
            group,
            total,
            elements: choices.map((e) => ({
                elementId: e.id!,
                options: e.options.map((o) => ({
                    optionId: o.id!,
                    count: counts.filter((c) => groupOf(c.g) === group && c.option_id === o.id).reduce((s, c) => s + c.n, 0),
                })),
            })),
        }
    })
    return { by, minGroupSize: MIN_GROUP_SIZE, groups }
}
