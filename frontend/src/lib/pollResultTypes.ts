// โมเดลผลโหวตที่หน้าจอใช้ (ทั้งเจ้าของและผู้ตอบ) แปลงจาก PollResults ของ API + คำถามใน PollDetail
// API ส่งแค่ id ของคำถาม/ตัวเลือก ชื่อคำถามและข้อความตัวเลือกมาจาก elements ของโพล
import type { Element, PollResults, PollStatus, ResultDisplay } from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'

export type ResultQuestionType = 'single_choice' | 'multi_choice' | 'dropdown' | 'text_question'

// ตัวเลือกที่พร้อมแสดง: count/pct เป็น null เมื่อเจ้าของซ่อนตัวเลขนั้น (ตัดมาตั้งแต่ server)
// weight = สัดส่วนเทียบตัวเลือกที่ได้มากสุด (0–1) ใช้วาดแท่ง/ชิ้นโดนัท
export type DisplayOption = { id: string; label: string; count: number | null; pct: number | null; weight: number }
export type DisplayNumbers = { count: boolean; percent: boolean }

export type ResultQuestion = {
    elementId: string
    // ลำดับ "ข้อ n" นับเฉพาะคำถาม ไม่นับองค์ประกอบตกแต่ง
    order: number
    title: string
    type: ResultQuestionType
    // null เมื่อเจ้าของซ่อนจำนวนผู้ตอบ
    respondentCount: number | null
    options: DisplayOption[]
}

export type ResultsModel = {
    pollId: string
    status: PollStatus
    totalRespondents: number | null
    numbers: DisplayNumbers
    questions: ResultQuestion[]
}

export const isChoiceQuestion = (q: ResultQuestion) => q.type !== 'text_question'

// display = การตั้งค่าเผยแพร่ (ผู้ตอบ) บอกว่าตัวเลขไหนถูกซ่อน · ไม่ส่ง = เจ้าของ/แอดมิน เห็นทุกตัวเลข
export function toResultsModel(
    poll: { id: string; status: PollStatus; elements: Element[] },
    results: PollResults,
    display?: ResultDisplay,
): ResultsModel {
    const questions = poll.elements.filter(isQuestion)
    const byId = new Map(results.elements.map((r) => [r.elementId, r]))
    return {
        pollId: poll.id,
        status: results.status ?? poll.status,
        totalRespondents: results.totalBallots,
        numbers: { count: display?.showCount ?? true, percent: display?.showPercent ?? true },
        questions: questions.flatMap((q, i) => {
            const r = byId.get(q.id!)
            if (!r) return []
            const labelOf = new Map(isChoice(q) ? q.options.map((o) => [o.id!, o.label]) : [])
            return [{
                elementId: q.id!,
                order: i + 1,
                title: q.title ?? '',
                type: q.type,
                respondentCount: r.answered,
                options: 'options' in r
                    ? r.options.map((o) => ({ id: o.optionId, label: labelOf.get(o.optionId) ?? '', count: o.count, pct: o.percent, weight: o.weight }))
                    : [],
            }]
        }),
    }
}
