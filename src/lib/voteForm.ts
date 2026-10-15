// ตัวช่วยของหน้ากรอกโพล ใช้ได้ทั้ง server และ client (ไม่มี import ของ pg)
import type { ElementItem, InputItem } from '@/store/elementStore'
import type { PollStatus, Scope } from '@/dtos/pollcardDto'
import type { AudienceScope } from '@/lib/audienceLabel'

// radio/select → optionId เดียว · checkbox → array ของ optionId · text → ข้อความ (API contract §4)
export type AnswerValue = string | string[]
export type Answers = Record<string, AnswerValue>

// item ที่ seed ไว้บางตัวไม่มี id จึงใช้ id คงที่จาก position แทน (แบบเดียวกับหน้าแก้ฉบับร่าง)
export type VoteItem = (InputItem | ElementItem) & { key: string; position: number }
export type VoteQuestion = InputItem & { key: string; position: number; order: number }

export type VoterPoll = {
    id: string
    title: string
    description: string
    scope: Scope
    status: PollStatus
    realtime: boolean
    allowRepeat: boolean
    closeAt: string
    // ปิดก่อนกำหนด: หน้ากรอกต้องบอกว่า "ถูกปิดก่อน" ไม่ใช่หมดเวลา (System flow §7) · ไม่ส่ง closedBy มาหน้านี้
    closedAt: string | null
    closedEarly: boolean
    closeReason: string | null
    audienceLabel: string
    audienceScope: AudienceScope | null
    // เจ้าของโพลเห็นรหัสผู้ตอบ (สวิตช์ "ระบุคนส่ง")
    identifySender: boolean
    // โพลที่ยังไม่เปิดให้ตอบจะไม่ส่ง items มา (ของที่ยังไม่ควรมีใครเห็น)
    items: VoteItem[]
    questionCount: number
    // ผู้ตอบเห็นผลได้หรือไม่ (เจ้าของตั้งจากหน้า dashboard)
    resultsPublished: boolean
}

export type MyResponse = {
    // draft = กรอกค้างไว้ · submitted = ส่งแล้วและยังไม่มีฉบับร่างใหม่
    status: 'none' | 'draft' | 'submitted'
    answers: Answers
    lastSavedAt: string | null
    // ส่งครั้งล่าสุดเมื่อไหร่ (มีค่าแม้กำลังกรอกฉบับร่างรอบใหม่ของโพลที่ตอบซ้ำได้)
    submittedAt: string | null
}

export type IneligibleReason = 'NOT_OPEN' | 'CLOSED' | 'OUT_OF_SCOPE' | 'ALREADY_VOTED'

export const itemKey = (pollId: string, position: number, id?: string) => id || `${pollId}-${position}`

// โพลแบบ C ตอบซ้ำได้เสมอ (System flow §3)
export const canRepeat = (poll: Pick<VoterPoll, 'scope' | 'allowRepeat'>) => poll.scope === 'C' || poll.allowRepeat

// โพลที่สถานะยัง VOTING แต่เลยเวลาปิดแล้วถือว่าปิด เผื่องานที่ตัดสถานะยังไม่ได้รัน
export const isOpenForVoting = (poll: Pick<VoterPoll, 'status' | 'closeAt'>, now = Date.now()) =>
    poll.status === 'VOTING' && new Date(poll.closeAt).getTime() > now

// แบ่งหน้าตาม pagebreak (API contract §3) pagebreak ไม่ถูกวาด แค่เป็นตัวตัดหน้า
export function paginate<T extends { kind: string; type: string }>(items: T[]): T[][] {
    const pages: T[][] = [[]]
    for (const item of items) {
        if (item.kind === 'element' && item.type === 'pagebreak') {
            pages.push([])
            continue
        }
        pages[pages.length - 1].push(item)
    }
    // ตัดหน้าว่างที่เกิดจาก pagebreak ติดกันหรืออยู่ท้ายสุด
    const filled = pages.filter((page) => page.length > 0)
    return filled.length > 0 ? filled : [[]]
}

export function questionsOf(items: VoteItem[]): VoteQuestion[] {
    return items
        .filter((item): item is VoteItem & InputItem => item.kind === 'input')
        .map((item, index) => ({ ...item, order: index + 1 }))
}

export const TEXT_ANSWER_MAX = 2000

export function isAnswered(question: InputItem, value: AnswerValue | undefined) {
    if (value === undefined) return false
    if (question.type === 'checkbox') return Array.isArray(value) && value.length > 0
    return typeof value === 'string' && value.trim() !== ''
}

// ข้อบังคับข้อแรกที่ยังไม่ได้ตอบ (ใช้ทั้งตอนกดถัดไปของแต่ละหน้า และตรวจทั้งฟอร์มก่อนส่ง)
export function firstMissingRequired(questions: VoteQuestion[], answers: Answers) {
    return questions.find((q) => q.required && !isAnswered(q, answers[q.key])) ?? null
}

// หน้าที่ควรกลับไปทำต่อ = หน้าที่มีข้อแรกที่ยังไม่ได้ตอบ ถ้าตอบครบแล้วไปหน้าสุดท้าย
export function resumePageIndex(pages: VoteItem[][], answers: Answers) {
    const index = pages.findIndex((page) =>
        page.some((item) => item.kind === 'input' && !isAnswered(item, answers[item.key])))
    return index === -1 ? pages.length - 1 : index
}

// เวลาโดยประมาณ ~20 วินาทีต่อข้อ ปัดขึ้นเป็นนาที อย่างน้อย 1 นาที
export const estimateMinutes = (questionCount: number) => Math.max(1, Math.ceil((questionCount * 20) / 60))

// ทำความสะอาดคำตอบตามชนิดคำถาม ตัดคำตอบของข้อที่ไม่มีอยู่และตัวเลือกที่ไม่มีจริงทิ้ง
// คืน error ถ้าค่าผิดชนิด (ใช้ที่ server ก่อนเขียนลงฐานข้อมูล)
export function normalizeAnswers(questions: VoteQuestion[], raw: unknown): { ok: true; value: Answers } | { ok: false; error: string } {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'answers ต้องเป็น object' }
    const input = raw as Record<string, unknown>
    const value: Answers = {}
    for (const q of questions) {
        const v = input[q.key]
        if (v === undefined || v === null) continue
        if (q.type === 'text') {
            if (typeof v !== 'string') return { ok: false, error: `คำตอบข้อ ${q.order} ต้องเป็นข้อความ` }
            if (v.length > TEXT_ANSWER_MAX) return { ok: false, error: `คำตอบข้อ ${q.order} ยาวเกิน ${TEXT_ANSWER_MAX} ตัวอักษร` }
            if (v.trim()) value[q.key] = v
            continue
        }
        const optionIds = new Set(q.options.map((o) => o.id))
        if (q.type === 'checkbox') {
            if (!Array.isArray(v) || !v.every((id) => typeof id === 'string' && optionIds.has(id))) {
                return { ok: false, error: `ตัวเลือกข้อ ${q.order} ไม่ถูกต้อง` }
            }
            const picked = [...new Set(v as string[])]
            if (picked.length > 0) value[q.key] = picked
            continue
        }
        if (typeof v !== 'string' || !optionIds.has(v)) return { ok: false, error: `ตัวเลือกข้อ ${q.order} ไม่ถูกต้อง` }
        value[q.key] = v
    }
    return { ok: true, value }
}
