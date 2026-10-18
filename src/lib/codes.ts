import type { CodeKind } from '@/api/types'

// รูปแบบรหัส: นิสิตจุฬาฯ 10 หลัก, บุคลากร 8 หลัก (ตัวเลขทั้งหมด) ใช้ทั้งหน้า create และหน้า preset
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

export { parseCodes } from '@/lib/pollMappers'
