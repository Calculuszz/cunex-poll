import { buildDraftPayload } from './buildPayload'
import { useCreatePollStore } from '@/store/createPollStore'
import { useElementStore } from '@/store/elementStore'

export type SaveDraftResult = { ok: true; id: string } | { ok: false; error: string }

// บันทึกฉบับร่างลง DB: ยังไม่มี draftId ให้สร้างใหม่ (POST) มีแล้วให้เขียนทับ (PUT) ทั้งสองแบบเป็นสถานะ DRAFT
// สำเร็จแล้วล้างฟอร์มในเครื่อง เพราะข้อมูลอยู่ใน DB แล้ว
export async function saveDraft(draftId: string | null): Promise<SaveDraftResult> {
    const built = buildDraftPayload(useCreatePollStore.getState(), useElementStore.getState().items)
    if (!built.ok) return { ok: false, error: built.error }

    try {
        const res = await fetch(draftId ? `/api/polls/${draftId}` : '/api/polls', {
            method: draftId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(built.payload),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => null)
            return { ok: false, error: data?.error ?? 'บันทึกฉบับร่างไม่สำเร็จ' }
        }
        const { id } = (await res.json()) as { id: string }
        useCreatePollStore.getState().reset()
        useElementStore.getState().removeAll()
        return { ok: true, id }
    } catch {
        return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่' }
    }
}
