import type { IPollCardDTO } from '@/dtos/pollcardDto'

// โพลฉบับร่างกดแล้วไปหน้าแก้ไข ส่วนโพลอื่นไปหน้า dashboard
export function pollHref(poll: Pick<IPollCardDTO, 'id' | 'type'>): string {
    return poll.type === 'DRAFT' ? `/create/${poll.id}` : `/dashboard/${poll.id}`
}

// หน้าแอดมินเปิดโพลที่หน้า /admin/(slug) ซึ่งเห็นรายชื่อผู้ตอบ (System flow §4) ฉบับร่างไม่อยู่ในหน้าแอดมิน
export function adminPollHref(poll: Pick<IPollCardDTO, 'id'>): string {
    return `/admin/${poll.id}`
}

// หน้ากรอกโพลของผู้ตอบ (หน้ารวมโพล)
export function votePollHref(poll: Pick<IPollCardDTO, 'id'>): string {
    return `/${poll.id}`
}
