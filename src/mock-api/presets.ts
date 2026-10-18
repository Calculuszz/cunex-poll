import 'server-only'
import type { CodeKind } from '@/api/types'
import { problem } from './http'

export const PRESET_SQL = `SELECT id, name, code_kind AS "codeKind", codes, created_at AS "createdAt" FROM code_presets`
export const PRESET_NAME_MAX = 60

export function parsePresetName(value: unknown): string {
    const name = typeof value === 'string' ? value.trim() : ''
    if (!name || name.length > PRESET_NAME_MAX) throw problem(400, 'BAD_REQUEST', `ชื่อ preset ต้องไม่ว่างและไม่เกิน ${PRESET_NAME_MAX} ตัวอักษร`)
    return name
}

// นิสิต 10 หลัก บุคลากร 8 หลัก (ตัวเลขล้วน) ตรวจซ้ำที่ server ไม่พึ่งแค่หน้าเว็บ
export function parsePreset(b: Record<string, unknown>): { name: string; codeKind: CodeKind; codes: string[] } {
    const name = parsePresetName(b.name)
    const codeKind = b.codeKind
    if (codeKind !== 'STUDENT' && codeKind !== 'STAFF') throw problem(400, 'BAD_REQUEST', 'codeKind ต้องเป็น STUDENT หรือ STAFF')
    if (!Array.isArray(b.codes) || !b.codes.every((c) => typeof c === 'string')) throw problem(400, 'BAD_REQUEST', 'codes ต้องเป็น array ของ string')
    const codes = [...new Set((b.codes as string[]).map((c) => c.trim()).filter(Boolean))]
    if (codes.length === 0) throw problem(400, 'BAD_REQUEST', 'ต้องมีรหัสอย่างน้อยหนึ่งรหัส')
    const pattern = codeKind === 'STAFF' ? /^\d{8}$/ : /^\d{10}$/
    if (codes.some((c) => !pattern.test(c))) {
        throw problem(422, 'INVALID_CODES', `รหัส${codeKind === 'STAFF' ? 'บุคลากรต้องเป็นตัวเลข 8' : 'นิสิตต้องเป็นตัวเลข 10'} หลักทุกบรรทัด`)
    }
    return { name, codeKind, codes }
}
