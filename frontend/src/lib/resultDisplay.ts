// ตัวช่วยการตั้งค่าเผยแพร่ผล (ResultDisplay ของ API)
import type { ResultDisplay } from '@/api/types'
import type { DisplayNumbers, DisplayOption, ResultsModel } from '@/lib/pollResultTypes'

export type { DisplayNumbers, DisplayOption } from '@/lib/pollResultTypes'

// ตัวอย่างในหน้าตั้งค่า: จำลองการกรองที่ backend ทำก่อนส่งผลให้ผู้ตอบ (เฉพาะข้อแบบเลือกที่เลือก + ซ่อนตัวเลข)
// ผู้ตอบจริงได้ข้อมูลที่กรองแล้วจาก GET /results ไม่ได้ใช้ฟังก์ชันนี้
export function applyDisplay(model: ResultsModel, display: ResultDisplay): ResultsModel {
    return {
        ...model,
        totalRespondents: display.showTotal ? model.totalRespondents : null,
        numbers: { count: display.showCount, percent: display.showPercent },
        questions: model.questions
            .filter((q) => q.type !== 'text_question')
            .filter((q) => display.elementIds === null || display.elementIds.includes(q.elementId))
            .map((q) => ({
                ...q,
                respondentCount: display.showTotal ? q.respondentCount : null,
                options: q.options.map((o) => ({
                    ...o,
                    count: display.showCount ? o.count : null,
                    pct: display.showPercent ? o.pct : null,
                })),
            })),
    }
}

// ข้อความตัวเลขของตัวเลือกตามที่เปิดเผย: "70 คน · 36.8%" / "70 คน" / "36.8%" / ""
export function formatOptionNumbers(option: DisplayOption, numbers: DisplayNumbers) {
    const parts: string[] = []
    if (numbers.count && option.count !== null) parts.push(`${option.count.toLocaleString('th-TH')} คน`)
    if (numbers.percent && option.pct !== null) parts.push(`${option.pct.toFixed(1)}%`)
    return parts.join(' · ')
}
