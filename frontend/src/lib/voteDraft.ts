import type { Answer, BallotDraft } from '@/api/types'

// ฉบับร่างคำตอบที่ยังไม่ได้ส่ง เก็บในเบราว์เซอร์ของผู้ใช้ (localStorage) ไม่ส่งขึ้น server
// backend ไม่เก็บคำตอบที่ยังไม่ส่ง เพื่อไม่ให้มีร่องรอยว่าใครกำลังตอบอะไร
// ใช้ได้เฉพาะฝั่ง client · localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว / ถูกบล็อก) จึงครอบ try ทุกครั้ง

const key = (pollId: string) => `vote-draft:v1:${pollId}`

export function readDraft(pollId: string): BallotDraft | null {
    try {
        const raw = localStorage.getItem(key(pollId))
        if (!raw) return null
        const draft = JSON.parse(raw) as BallotDraft
        return Array.isArray(draft.answers) && typeof draft.savedAt === 'string' ? draft : null
    } catch {
        return null
    }
}

export function writeDraft(pollId: string, answers: Answer[]): BallotDraft {
    const draft: BallotDraft = { answers, savedAt: new Date().toISOString() }
    try {
        localStorage.setItem(key(pollId), JSON.stringify(draft))
    } catch {
        // เก็บไม่ได้ก็ยังตอบต่อได้ แค่ปิดหน้าแล้วคำตอบที่ยังไม่ส่งจะหาย
    }
    return draft
}

export function clearDraft(pollId: string) {
    try {
        localStorage.removeItem(key(pollId))
    } catch {
        // ไม่มีอะไรต้องทำ
    }
}
