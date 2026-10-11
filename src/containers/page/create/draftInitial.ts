import type { PollDetail } from '@/lib/polls'
import type { FormItem } from '@/store/elementStore'
import type { CreatePollState } from '@/store/createPollStore'

export type DraftInitial = { id: string; form: CreatePollState; items: FormItem[] }

// ข้อมูลฉบับร่างจาก DB แปลงเป็นค่าของฟอร์มสร้างโพล (กลับทิศกับ buildPayload)
export function toDraftInitial(poll: PollDetail): DraftInitial {
    const { audience } = poll
    return {
        id: poll.id,
        form: {
            title: poll.title,
            desc: poll.desc,
            closeTime: poll.closeTime.toISOString(),
            scope: poll.scope,
            realtime: poll.realtime,
            allowRepeat: poll.allowRepeat,
            showExplore: poll.showExplore,
            identifySender: poll.identifySender,
            audienceIds: [...audience.faculties, ...audience.departments],
            codeKind: audience.codeKind ?? 'STUDENT',
            codesText: audience.studentCodes.join('\n'),
        },
        // คำถามจาก seed ยังไม่มี id จึงสร้างจากโพลกับตำแหน่งแทน (คงที่ทุกครั้งที่โหลด) ใช้เป็น key ของรายการได้
        items: poll.items.map((item) => ({ ...item.data, id: String(item.data.id ?? `${poll.id}-${item.position}`) }) as FormItem),
    }
}
