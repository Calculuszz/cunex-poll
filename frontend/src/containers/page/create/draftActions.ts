import { api, errorMessage, isApiError } from '@/api'
import type { PollDetail, Problem } from '@/api/types'
import { formToDraft } from '@/lib/pollMappers'
import { useCreatePollStore } from '@/store/createPollStore'
import { useCreateDraftStore } from '@/store/createDraftStore'
import { useElementStore } from '@/store/elementStore'

export type DraftResult = { ok: true; poll: PollDetail } | { ok: false; error: string; problems?: string[] }

// ชื่อช่องจาก path ใน problems ของ API (เช่น elements.2.options.0.label) → ข้อความที่ผู้ใช้อ่านเข้าใจ
const TOP_FIELDS: Record<string, string> = {
    title: 'ชื่อโพล',
    description: 'คำอธิบาย',
    opensAt: 'เวลาเปิดโหวต',
    closesAt: 'เวลาปิดโหวต',
    coverImageUrl: 'รูปปก',
    audience: 'ประเภทโพล',
    settings: 'การตั้งค่าโพล',
    elements: 'คำถาม',
}
const ELEMENT_FIELDS: Record<string, string> = {
    title: 'หัวข้อคำถาม',
    description: 'คำอธิบาย',
    imageUrl: 'รูป',
    imageAlt: 'คำอธิบายรูป',
    url: 'รูป',
    minSelect: 'จำนวนที่ต้องเลือกขั้นต่ำ',
    maxSelect: 'จำนวนที่เลือกได้สูงสุด',
    maxLength: 'ความยาวสูงสุด',
    placeholder: 'ข้อความตัวอย่าง',
    heading: 'หัวข้อ',
    body: 'เนื้อหา',
    buttonText: 'ข้อความปุ่ม',
    label: 'ข้อความตัวเลือก',
    popup: 'รายละเอียดตัวเลือก',
}

function describePath(path: string) {
    // รองรับทั้ง elements.2.title และ elements[2].title
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
    const [top, index, ...rest] = parts
    if (top === 'audience') return index === 'rules' ? 'คณะ/ปีเข้า' : 'ประเภทโพล'
    if (top !== 'elements' || index === undefined) return TOP_FIELDS[top] ?? 'ข้อมูลโพล'
    const out = [`รายการที่ ${Number(index) + 1}`]
    for (let i = 0; i < rest.length; i++) {
        const key = rest[i]
        const next = rest[i + 1]
        if (key === 'options' && next !== undefined && /^\d+$/.test(next)) { out.push(`ตัวเลือกที่ ${Number(next) + 1}`); i++ }
        else if (key === 'sections' && next !== undefined && /^\d+$/.test(next)) { out.push(`ส่วนที่ ${Number(next) + 1}`); i++ }
        else if (key === 'options') out.push('ตัวเลือก')
        else if (ELEMENT_FIELDS[key]) out.push(ELEMENT_FIELDS[key])
    }
    return out.join(' · ')
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
    if (isApiError(err, 'UNPROCESSABLE') && err.problem.problems?.length) {
        return { ok: false, error: 'ข้อมูลบางช่องไม่ถูกต้อง แก้รายการต่อไปนี้ก่อน', problems: describeProblems(err.problem.problems) }
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
        // ฟอร์มนี้เป็นของฉบับร่างบน server แล้ว ถ้าค้างในเครื่องจะไม่ถูกนับเป็นโพลใหม่อีก
        useCreatePollStore.getState().setSourceId(poll.id)
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
