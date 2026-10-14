import React from 'react'
import type { PollDetail } from '@/lib/polls'
import { formatThaiDateTime, formatTimeLeftShort } from '@/lib/thaiDate'
import { audienceLabel } from '@/lib/audienceLabel'

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
