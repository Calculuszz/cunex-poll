export type PollStatus = "DRAFT" | "PENDING" | "APPROVED" | "VOTING" | "DONE" | "REJECTED";
export type Scope = "A" | "B" | "C" | "D"

export interface IPollCardDTO{
    id: string;
    type: PollStatus;
    scope: Scope;
    realtime: boolean;
    title: string;
    desc: string;
    question: number;
    closeTime: Date
    // เวลาที่ปิดจริง (null = ยังไม่ปิด หรือหมดเวลาเองโดยไม่มีการบันทึก) คนละตัวกับ closeTime ที่เป็นเวลาที่ตั้งไว้
    closedAt: Date | null
    closedEarly: boolean
    showExplore: boolean
    // เจ้าของโพลเห็นรหัสผู้ตอบ (สวิตช์ "ระบุคนส่ง") ป้ายบนการ์ดให้ผู้ตอบรู้ก่อนกดเข้า
    identifySender: boolean
}

export function toPollCardDTO(raw: any):IPollCardDTO{
    return {
        id: raw.id,
        type: raw.type,
        scope: raw.scope,
        realtime: raw.realtime,
        title: raw.title,
        desc: raw.desc,
        question: raw.question,
        closeTime: raw.close,
        closedAt: raw.closedAt ?? null,
        closedEarly: raw.closedEarly ?? false,
        showExplore: raw.showExplore ?? false,
        identifySender: raw.identifySender ?? false,
    }
}
