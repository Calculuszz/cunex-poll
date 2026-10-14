import React from 'react'
import type { PollDetail } from '@/lib/polls'
import { formatThaiDateTime, formatTimeLeftShort } from '@/lib/thaiDate'
import { MOCK_FACULTIES } from '@/containers/page/create/components/mockFaculty'

// ข้อความขอบเขตผู้ตอบตามประเภทโพล
function audienceLabel(poll: PollDetail) {
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

// รายละเอียดโพลแบบ label/value เรียงลงล่าง
export function PollMetaInfo({ poll }: { poll: PollDetail }) {
    const rows = [
        { label: 'ขอบเขตผู้ตอบ', value: audienceLabel(poll) },
        { label: 'เวลาปิดโหวต', value: `${formatThaiDateTime(poll.closeTime)} (${formatTimeLeftShort(poll.closeTime)})` },
        { label: 'การลงคะแนนซ้ำ', value: poll.allowRepeat || poll.scope === 'C' ? 'ลงคะแนนซ้ำได้' : 'หนึ่งคนหนึ่งเสียง' },
    ]
    return (
        <dl className='flex flex-col gap-2'>
            {rows.map((row) => (
                <div key={row.label}>
                    <dt className='text-sm text-ink-500'>{row.label}</dt>
                    <dd className='pl-2 text-base'>{row.value}</dd>
                </div>
            ))}
        </dl>
    )
}
