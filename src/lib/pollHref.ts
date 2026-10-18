import type { PollSummary } from '@/api/types'

// ฉบับร่างและโพลที่ถูกปฏิเสธกดแล้วไปหน้าแก้ไข (แก้แล้วส่งใหม่ได้) ส่วนโพลอื่นไปหน้า dashboard
export function pollHref(poll: Pick<PollSummary, 'id' | 'status'>): string {
    return poll.status === 'draft' || poll.status === 'rejected' ? `/create/${poll.id}` : `/dashboard/${poll.id}`
}

// หน้าแอดมินเปิดโพลที่หน้า /admin/(slug) (ปุ่มอนุมัติ/ปฏิเสธ/ถอดโพล)
export function adminPollHref(poll: Pick<PollSummary, 'id'>): string {
    return `/admin/${poll.id}`
}

// หน้ากรอกโพลของผู้ตอบ (หน้ารวมโพล)
export function votePollHref(poll: Pick<PollSummary, 'id'>): string {
    return `/${poll.id}`
}
