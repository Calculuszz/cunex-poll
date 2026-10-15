import type { PollDetail } from '@/lib/polls'
import { MOCK_FACULTIES } from '@/containers/page/create/components/mockFaculty'

type AudienceSource = Pick<PollDetail, 'scope' | 'audience'>

// ขอบเขตแบบมีโครงสร้างของโพลแบบ B (System flow §3) ให้หน้าจอเลือกเองว่าจะย่อแค่ไหน
// whole = เลือกทั้งคณะ · departments = ชื่อสาขาที่เลือก (ว่างเมื่อ whole)
export type AudienceGroup = { faculty: string; whole: boolean; departments: string[] }
export type AudienceScope = { groups: AudienceGroup[]; facultyCount: number; departmentCount: number }

// เรียงตามตารางคณะ ไม่ใช่ตามลำดับที่ creator กดเลือก โพลที่ขอบเขตเหมือนกันจะได้แสดงลำดับเดียวกัน
// นับสาขา: เลือกทั้งคณะ = นับทุกสาขาของคณะนั้น
export function audienceScope(poll: AudienceSource): AudienceScope | null {
    if (poll.scope !== 'B') return null
    const groups: AudienceGroup[] = []
    let departmentCount = 0
    for (const f of MOCK_FACULTIES) {
        const whole = poll.audience.faculties.includes(f.value)
        const departments = whole ? [] : f.departments.filter((d) => poll.audience.departments.includes(d.value))
        if (!whole && departments.length === 0) continue
        groups.push({ faculty: `คณะ${f.label}`, whole, departments: departments.map((d) => d.label) })
        departmentCount += whole ? f.departments.length : departments.length
    }
    return { groups, facultyCount: groups.length, departmentCount }
}

// ป้ายบรรทัดเดียวของหนึ่งคณะ ครอบชั้นสาขาด้วยวงเล็บ ไม่ให้สับสนว่าเป็นคณะหรือสาขา
export const groupLabel = (g: AudienceGroup) => `${g.faculty} (${g.whole ? 'ทั้งคณะ' : g.departments.join(', ')})`

// ข้อความขอบเขตผู้ตอบแบบบรรทัดเดียว ใช้ที่ที่ใส่ปุ่มไม่ได้
export function audienceLabel(poll: AudienceSource) {
    switch (poll.scope) {
        case 'A':
            return 'นิสิตและบุคลากรจุฬาฯ ทุกคน'
        case 'C':
            return 'ทุกคนที่มีลิงก์ (สาธารณะ)'
        case 'D':
            return `เฉพาะ${poll.audience.codeKind === 'STAFF' ? 'บุคลากร' : 'นิสิต'}ตามรหัสที่กำหนด ${poll.audience.studentCodes.length} รหัส`
        case 'B': {
            const groups = audienceScope(poll)?.groups ?? []
            return groups.length > 0 ? groups.map(groupLabel).join(', ') : 'เฉพาะคณะ/สาขาที่กำหนด'
        }
    }
}
