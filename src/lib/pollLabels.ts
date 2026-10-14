import type { IPollCardDTO } from '@/dtos/pollcardDto'

export const STATUS_LABEL: Record<IPollCardDTO['type'], string> = {
    DRAFT: 'ฉบับร่าง',
    PENDING: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    VOTING: 'กำลังโหวต',
    DONE: 'จบแล้ว',
    REJECTED: 'ไม่อนุมัติ',
}

// สีชิปสถานะ ใช้ชุดเดียวกันทุกที่ที่แสดงสถานะโพล
// เขียว = กำลังรับคำตอบ, เหลือง = รอคนตัดสิน, ฟ้า = อนุมัติแล้วรอเปิด, แดง = ไม่อนุมัติ, เทา = ยังไม่เริ่ม/จบไปแล้ว
export const STATUS_BADGE_CLASS: Record<IPollCardDTO['type'], string> = {
    DRAFT: 'bg-badge text-muted',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-200',
    VOTING: 'bg-green-100 text-green-200',
    DONE: 'bg-badge text-muted',
    REJECTED: 'bg-red-100 text-red-200',
}

export const SCOPE_LABEL: Record<IPollCardDTO['scope'], string> = {
    A: 'ทั้งจุฬา ฯ',
    B: 'เฉพาะคณะ/สาขา',
    C: 'สาธารณะ',
    D: 'กำหนดจากรหัส',
}

// ใช้ timeZone คงที่ เพื่อให้ server กับ client แสดงเวลาเหมือนกันตอน hydrate
const closeFormatter = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
})

export function formatCloseTime(date: Date) {
    return closeFormatter.format(date)
}
