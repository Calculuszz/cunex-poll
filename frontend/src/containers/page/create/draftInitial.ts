import type { PollDetail } from '@/api/types'
import type { FormItem } from '@/store/elementStore'
import type { CreatePollState } from '@/store/createPollStore'
import { detailToForm } from '@/lib/pollMappers'

// version ใช้ส่ง If-Match ตอนบันทึกทับ · rejection = ความเห็นจากแอดมินครั้งล่าสุด (โพลที่ถูกปฏิเสธแล้วกลับมาแก้)
export type DraftInitial = { id: string; version: number; form: CreatePollState; items: FormItem[]; rejection: string | null }

export function toDraftInitial(poll: PollDetail): DraftInitial {
    const lastReview = poll.reviews?.[0]
    return {
        id: poll.id,
        version: poll.version,
        ...detailToForm(poll),
        rejection: poll.status === 'rejected' ? lastReview?.comment ?? 'ผู้ดูแลระบบไม่ได้ให้ความเห็นไว้' : null,
    }
}
