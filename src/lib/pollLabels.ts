import type { IPollCardDTO } from '@/dtos/pollcardDto'

export const STATUS_LABEL: Record<IPollCardDTO['type'], string> = {
    DRAFT: 'ฉบับร่าง',
    PENDING: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    VOTING: 'กำลังโหวต',
    DONE: 'จบแล้ว',
    REJECTED: 'ไม่อนุมัติ',
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
