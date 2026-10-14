import type { PollDetail } from '@/lib/polls'
import { MOCK_FACULTIES } from '@/containers/page/create/components/mockFaculty'

// ข้อความขอบเขตผู้ตอบตามประเภทโพล
export function audienceLabel(poll: Pick<PollDetail, 'scope' | 'audience'>) {
    switch (poll.scope) {
        case 'A':
            return 'นิสิตและบุคลากรจุฬาฯ ทุกคน'
        case 'C':
            return 'ทุกคนที่มีลิงก์ (สาธารณะ)'
        case 'D':
            return `เฉพาะ${poll.audience.codeKind === 'STAFF' ? 'บุคลากร' : 'นิสิต'}ตามรหัสที่กำหนด ${poll.audience.studentCodes.length} รหัส`
        case 'B': {
            const names = [
                ...MOCK_FACULTIES.filter((f) => poll.audience.faculties.includes(f.value)).map((f) => `คณะ${f.label}`),
                ...MOCK_FACULTIES.flatMap((f) => f.departments)
                    .filter((d) => poll.audience.departments.includes(d.value))
                    .map((d) => `สาขา${d.label}`),
            ]
            return names.length > 0 ? names.join(', ') : 'เฉพาะคณะ/สาขาที่กำหนด'
        }
    }
}
