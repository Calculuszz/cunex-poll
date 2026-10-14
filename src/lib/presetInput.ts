// รูปแบบ body ของ preset รหัส ใช้ร่วมกันทั้ง POST และ PATCH ของ /api/presets

export type PresetKind = 'STUDENT' | 'STAFF'

export const PRESET_NAME_MAX = 60

// นิสิต 10 หลัก บุคลากร 8 หลัก (ตัวเลขล้วน) ตรงกับ CODE_PATTERNS ฝั่ง UI
const CODE_PATTERNS: Record<PresetKind, RegExp> = {
    STUDENT: /^\d{10}$/,
    STAFF: /^\d{8}$/,
}

export function parsePresetName(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const name = value.trim()
    if (!name || name.length > PRESET_NAME_MAX) return null
    return name
}

export function parsePresetBody(body: unknown): { ok: true; value: { name: string; codeKind: PresetKind; codes: string[] } } | { ok: false; error: string } {
    if (typeof body !== 'object' || body === null) return { ok: false, error: 'body ต้องเป็น object' }
    const b = body as Record<string, unknown>

    const name = parsePresetName(b.name)
    if (!name) return { ok: false, error: `ชื่อ preset ต้องไม่ว่างและไม่เกิน ${PRESET_NAME_MAX} ตัวอักษร` }

    const codeKind = b.codeKind
    if (codeKind !== 'STUDENT' && codeKind !== 'STAFF') return { ok: false, error: 'codeKind ต้องเป็น STUDENT หรือ STAFF' }

    if (!Array.isArray(b.codes) || !b.codes.every((c) => typeof c === 'string')) {
        return { ok: false, error: 'codes ต้องเป็น array ของ string' }
    }
    const codes = [...new Set(b.codes.map((c) => c.trim()).filter(Boolean))]
    if (codes.length === 0) return { ok: false, error: 'ต้องมีรหัสอย่างน้อยหนึ่งรหัส' }
    if (codes.some((code) => !CODE_PATTERNS[codeKind].test(code))) {
        return { ok: false, error: `รหัส${codeKind === 'STUDENT' ? 'นิสิต' : 'บุคลากร'}ต้องเป็นตัวเลข ${codeKind === 'STUDENT' ? 10 : 8} หลักทุกบรรทัด` }
    }

    return { ok: true, value: { name, codeKind, codes } }
}
