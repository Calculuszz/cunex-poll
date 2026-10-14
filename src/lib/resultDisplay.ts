// การตั้งค่าเผยแพร่ผลโหวตให้ผู้ตอบ และตัวแปลงผลเต็มของเจ้าของ → ผลที่ผู้ตอบเห็น
// ใช้ได้ทั้ง server (กรองข้อมูลก่อนส่งออก) และ client (ตัวอย่างในหน้าตั้งค่า) จึงไม่มี import ของ pg
import type { PollResults, ResultQuestion } from '@/lib/pollResultTypes'
import { RESULT_VIEWS, percentOf, type ResultView } from '@/lib/resultView'

export type ResultDisplaySettings = {
    // ปิด = ผู้ตอบไม่เห็นผลเลย ทั้งระหว่างเปิดโหวตและหลังปิด
    published: boolean
    // position ของคำถามที่เผยแพร่ · null = ทุกข้อแบบเลือก (รวมข้อที่อาจเพิ่มทีหลัง)
    questions: number[] | null
    views: ResultView[]
    showCount: boolean
    showPercent: boolean
    showTotal: boolean
}

export const DEFAULT_DISPLAY: ResultDisplaySettings = {
    published: true,
    questions: null,
    views: ['list'],
    showCount: true,
    showPercent: true,
    showTotal: true,
}

export function parseDisplaySettings(raw: unknown): ResultDisplaySettings | null {
    if (typeof raw !== 'object' || raw === null) return null
    const r = raw as Record<string, unknown>
    const bool = (v: unknown) => typeof v === 'boolean'
    if (!bool(r.published) || !bool(r.showCount) || !bool(r.showPercent) || !bool(r.showTotal)) return null
    const questions = r.questions === null
        ? null
        : Array.isArray(r.questions) && r.questions.every((q) => Number.isInteger(q) && q > 0)
            ? [...new Set(r.questions as number[])]
            : undefined
    if (questions === undefined) return null
    if (!Array.isArray(r.views)) return null
    const views = RESULT_VIEWS.filter((v) => (r.views as unknown[]).includes(v))
    if (views.length === 0) return null
    return {
        published: r.published as boolean,
        questions,
        views,
        showCount: r.showCount as boolean,
        showPercent: r.showPercent as boolean,
        showTotal: r.showTotal as boolean,
    }
}

// ตัวเลือกที่พร้อมแสดง: count/pct เป็น null เมื่อเจ้าของซ่อนตัวเลขนั้น (ตัดทิ้งตั้งแต่ server)
// weight = สัดส่วนเทียบตัวเลือกที่ได้มากสุด (0–1) ใช้วาดแท่ง/ชิ้นโดนัท เป็นข้อมูลที่กราฟเผยอยู่แล้ว ไม่ใช่ตัวเลขจริง
export type DisplayOption = { id: string; label: string; count: number | null; pct: number | null; weight: number }
export type DisplayNumbers = { count: boolean; percent: boolean }

export type DisplayQuestion = {
    position: number
    order: number
    title: string
    type: ResultQuestion['type']
    // null เมื่อเจ้าของซ่อนจำนวนผู้ตอบ
    respondentCount: number | null
    options: DisplayOption[]
}

export type VoterResultsPayload = {
    pollId: string
    status: PollResults['status']
    closeAt: string
    totalRespondents: number | null
    views: ResultView[]
    numbers: DisplayNumbers
    questions: DisplayQuestion[]
}

export function toDisplayOptions(question: ResultQuestion, numbers: DisplayNumbers): DisplayOption[] {
    const options = question.options ?? []
    const max = Math.max(0, ...options.map((o) => o.count))
    return options.map((o) => ({
        id: o.id,
        label: o.label,
        count: numbers.count ? o.count : null,
        pct: numbers.percent ? percentOf(o.count, question.respondentCount) : null,
        weight: max === 0 ? 0 : Math.round((o.count / max) * 1000) / 1000,
    }))
}

// ผลที่ผู้ตอบเห็นตามการตั้งค่า: เฉพาะข้อแบบเลือกที่เลือกไว้ และตัดตัวเลขที่ซ่อนออก
export function applyDisplay(results: PollResults, settings: ResultDisplaySettings): VoterResultsPayload {
    const numbers = { count: settings.showCount, percent: settings.showPercent }
    const questions = results.questions
        .filter((q) => q.type !== 'text')
        .filter((q) => settings.questions === null || settings.questions.includes(q.position))
        .map((q) => ({
            position: q.position,
            order: q.order,
            title: q.title,
            type: q.type,
            respondentCount: settings.showTotal ? q.respondentCount : null,
            options: toDisplayOptions(q, numbers),
        }))
    return {
        pollId: results.pollId,
        status: results.status,
        closeAt: results.closeAt,
        totalRespondents: settings.showTotal ? results.totalRespondents : null,
        views: settings.views,
        numbers,
        questions,
    }
}

// ข้อความตัวเลขของตัวเลือกตามที่เปิดเผย: "70 คน · 36.8%" / "70 คน" / "36.8%" / ""
export function formatOptionNumbers(option: DisplayOption, numbers: DisplayNumbers) {
    const parts: string[] = []
    if (numbers.count && option.count !== null) parts.push(`${option.count.toLocaleString('th-TH')} คน`)
    if (numbers.percent && option.pct !== null) parts.push(`${option.pct.toFixed(1)}%`)
    return parts.join(' · ')
}
