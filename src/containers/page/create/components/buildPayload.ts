import type { FormItem } from '@/store/elementStore'
import type { CodeKind, CreatePollState } from '@/store/createPollStore'
import { MOCK_FACULTIES } from './mockFaculty'

// รูปแบบรหัส: นิสิตจุฬาฯ 10 หลัก, บุคลากร 8 หลัก (ตัวเลขทั้งหมด)
export const CODE_PATTERNS: Record<CodeKind, RegExp> = {
    STUDENT: /^\d{10}$/,
    STAFF: /^\d{8}$/,
}

export const CODE_LENGTH: Record<CodeKind, number> = {
    STUDENT: 10,
    STAFF: 8,
}

export const CODE_KIND_LABEL: Record<CodeKind, string> = {
    STUDENT: 'นิสิต',
    STAFF: 'บุคลากร',
}

export function parseCodes(text: string): string[] {
    return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

export type CreatePollPayload = {
    title: string
    desc: string
    scope: CreatePollState['scope']
    type: 'PENDING' | 'DRAFT'
    realtime: boolean
    allowRepeat: boolean
    showExplore: boolean
    identifySender: boolean
    close: string
    audience: { faculties: string[]; departments: string[]; studentCodes: string[]; codeKind: CodeKind }
    items: FormItem[]
}

type BuildResult = { ok: true; payload: CreatePollPayload } | { ok: false; error: string }

// แปลงค่าฟอร์มเป็น body ของ POST /api/polls และตรวจความถูกต้องก่อนส่ง
// ส่งขออนุมัติ = สถานะ PENDING เสมอ
export function buildPollPayload(form: CreatePollState, items: FormItem[]): BuildResult {
    const title = form.title.trim()
    if (!title) return { ok: false, error: 'ต้องระบุชื่อโพล' }

    if (!form.closeTime) return { ok: false, error: 'ต้องระบุเวลาปิดโพล' }
    const close = new Date(form.closeTime)
    if (close.getTime() <= Date.now()) return { ok: false, error: 'เวลาปิดโพลต้องอยู่ในอนาคต' }

    // โพลสาธารณะล็อกสองสวิตช์ไว้ตามที่ UI แสดง จึงบังคับค่าเดิมตรงนี้ด้วย
    const isPublic = form.scope === 'C'

    const audience = { faculties: [] as string[], departments: [] as string[], studentCodes: [] as string[], codeKind: form.codeKind }

    if (form.scope === 'B') {
        const facultyIds = new Set(MOCK_FACULTIES.map((f) => f.value))
        for (const id of form.audienceIds) {
            if (facultyIds.has(id)) audience.faculties.push(id)
            else audience.departments.push(id)
        }
        if (audience.faculties.length === 0 && audience.departments.length === 0) {
            return { ok: false, error: 'เลือกคณะหรือสาขาอย่างน้อยหนึ่งรายการ' }
        }
    }

    if (form.scope === 'D') {
        const codes = parseCodes(form.codesText)
        const label = CODE_KIND_LABEL[form.codeKind]
        if (codes.length === 0) return { ok: false, error: `ใส่รหัส${label}อย่างน้อยหนึ่งรหัส` }
        if (codes.some((code) => !CODE_PATTERNS[form.codeKind].test(code))) {
            return { ok: false, error: `รหัส${label}ต้องเป็นตัวเลข ${CODE_LENGTH[form.codeKind]} หลักทุกบรรทัด` }
        }
        audience.studentCodes = codes
    }

    return {
        ok: true,
        payload: {
            title,
            desc: form.desc.trim(),
            scope: form.scope,
            type: 'PENDING',
            realtime: form.realtime,
            allowRepeat: isPublic ? true : form.allowRepeat,
            showExplore: form.showExplore,
            identifySender: isPublic ? false : form.identifySender,
            close: close.toISOString(),
            audience,
            items,
        },
    }
}

// ฉบับร่างบันทึกได้โดยยังไม่ครบ: ต้องมีชื่อกับเวลาปิด ส่วนที่เหลือเก็บตามที่กรอกไว้ ไม่ตรวจเวลาปิดต้องอยู่ในอนาคต
export function buildDraftPayload(form: CreatePollState, items: FormItem[]): BuildResult {
    const title = form.title.trim()
    if (!title) return { ok: false, error: 'ต้องระบุชื่อโพลก่อนบันทึกฉบับร่าง' }
    if (!form.closeTime) return { ok: false, error: 'ต้องระบุเวลาปิดโพลก่อนบันทึกฉบับร่าง' }

    const isPublic = form.scope === 'C'
    const audience = { faculties: [] as string[], departments: [] as string[], studentCodes: [] as string[], codeKind: form.codeKind }

    const facultyIds = new Set(MOCK_FACULTIES.map((f) => f.value))
    for (const id of form.audienceIds) {
        if (facultyIds.has(id)) audience.faculties.push(id)
        else audience.departments.push(id)
    }

    if (form.scope === 'D') {
        const codes = parseCodes(form.codesText)
        if (codes.some((code) => !CODE_PATTERNS[form.codeKind].test(code))) {
            return { ok: false, error: `รหัส${CODE_KIND_LABEL[form.codeKind]}ต้องเป็นตัวเลข ${CODE_LENGTH[form.codeKind]} หลักทุกบรรทัด` }
        }
        audience.studentCodes = codes
    }

    return {
        ok: true,
        payload: {
            title,
            desc: form.desc.trim(),
            scope: form.scope,
            type: 'DRAFT',
            realtime: form.realtime,
            allowRepeat: isPublic ? true : form.allowRepeat,
            showExplore: form.showExplore,
            identifySender: isPublic ? false : form.identifySender,
            close: new Date(form.closeTime).toISOString(),
            audience,
            items,
        },
    }
}
