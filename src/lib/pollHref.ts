import type { IPollCardDTO } from '@/dtos/pollcardDto'

// โพลฉบับร่างกดแล้วไปหน้าแก้ไข ส่วนโพลอื่นไปหน้า dashboard
export function pollHref(poll: Pick<IPollCardDTO, 'id' | 'type'>): string {
    return poll.type === 'DRAFT' ? `/create/${poll.id}` : `/dashboard/${poll.id}`
}
