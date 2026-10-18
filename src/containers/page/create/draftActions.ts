import { api, errorMessage, isApiError } from '@/api'
import type { PollDetail, Problem } from '@/api/types'
import { formToDraft } from '@/lib/pollMappers'
import { useCreatePollStore } from '@/store/createPollStore'
import { useCreateDraftStore } from '@/store/createDraftStore'
import { useElementStore } from '@/store/elementStore'

export type DraftResult = { ok: true; poll: PollDetail } | { ok: false; error: string; problems?: string[] }

// ชื่อช่องจาก path ใน problems ของ API (เช่น elements[2].options[0].label) → ข้อความที่ผู้ใช้อ่านเข้าใจ
function describePath(path: string) {
    if (path === 'title') return 'ชื่อโพล'
    if (path === 'closesAt') return 'เวลาปิดโหวต'
    if (path === 'coverImageUrl') return 'รูปปก'
    if (path.startsWith('audience')) return 'ขอบเขตผู้ตอบ'
    if (path === 'elements') return 'คำถาม'
    const m = /^elements\[(\d+)\](?:\.options\[(\d+)\])?/.exec(path)
    if (m) return `รายการที่ ${Number(m[1]) + 1}${m[2] !== undefined ? ` ตัวเลือกที่ ${Number(m[2]) + 1}` : ''}`
    return path
}

export const describeProblems = (problems: Problem['problems']) =>
    (problems ?? []).map((p) => `${describePath(p.path)}: ${p.message}`)

function toFailure(err: unknown, fallback: string): DraftResult {
    if (isApiError(err, 'VERSION_CONFLICT')) {
        return { ok: false, error: 'ฉบับร่างนี้ถูกแก้จากที่อื่นแล้ว โหลดหน้าใหม่ก่อนแก้ต่อ (ของที่แก้ในหน้านี้จะหาย)' }
    }
    if (isApiError(err, 'INVALID_IMAGE_URL')) {
        return { ok: false, error: 'มีรูปที่ไม่ได้อัปโหลดผ่านระบบ ลบรูปเหล่านี้แล้วเพิ่มใหม่', problems: describeProblems(err.problem.problems) }
    }
    if (isApiError(err, 'POLL_INCOMPLETE')) {
        return { ok: false, error: 'โพลยังไม่ครบ แก้รายการต่อไปนี้ก่อนส่ง', problems: describeProblems(err.problem.problems) }
    }
    if (isApiError(err, 'POLL_LOCKED')) return { ok: false, error: 'โพลนี้ส่งไปแล้ว แก้ไขไม่ได้' }
    return { ok: false, error: errorMessage(err, fallback) }
}

// บันทึกฉบับร่างขึ้น server: ยังไม่มี id → POST /polls · มีแล้ว → PUT พร้อม If-Match: version
export async function saveDraft(): Promise<DraftResult> {
    const draft = formToDraft(useCreatePollStore.getState(), useElementStore.getState().items)
    const { draftId, version, setDraft, setHydratedId } = useCreateDraftStore.getState()
    try {
        const poll = draftId && version !== null ? await api.polls.save(draftId, version, draft) : await api.polls.create(draft)
        setDraft(poll.id, poll.version)
        setHydratedId(poll.id)
        return { ok: true, poll }
    } catch (err) {
        return toFailure(err, 'บันทึกฉบับร่างไม่สำเร็จ')
    }
}

// ส่งขออนุมัติ = บันทึกล่าสุดก่อน แล้ว POST /submit (backend ตรวจความครบ ไม่ครบได้รายการปัญหากลับมา)
export async function submitDraft(): Promise<DraftResult> {
    const saved = await saveDraft()
    if (!saved.ok) return saved
    try {
        return { ok: true, poll: await api.polls.submit(saved.poll.id) }
    } catch (err) {
        return toFailure(err, 'ส่งขออนุมัติไม่สำเร็จ')
    }
}

// ล้างฟอร์มในเครื่อง (หลังบันทึก/ส่งสำเร็จ หรือเลือกทิ้งร่าง) ครั้งหน้าที่เปิดฉบับร่างจะโหลดจาก server ใหม่
export function resetCreateForm() {
    useCreatePollStore.getState().reset()
    useElementStore.getState().removeAll()
    useCreateDraftStore.getState().setHydratedId(null)
}
