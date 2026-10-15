import React from 'react'
import type { PollDetail } from '@/lib/polls'
import { formatThaiDateTime, formatTimeLeftShort } from '@/lib/thaiDate'
import { audienceLabel, audienceScope } from '@/lib/audienceLabel'
import { AudienceScopeView } from '@/components/common/audienceScopeView'
import { RealtimeSwitch } from './realtimeSwitch'

// สถานะที่ยังเปลี่ยนสวิตช์เรียลไทม์ได้ ฉบับร่างแก้ที่หน้าสร้างโพลแทน
const REALTIME_EDITABLE = ['PENDING', 'APPROVED']

// รายละเอียดโพลแบบ label/value เรียงลงล่าง
// view = 'admin' เห็นด้วยว่าใครกดปิดโพล (ข้อมูลภายใน ไม่แสดงในหน้าเจ้าของหรือหน้าสาธารณะ)
export function PollMetaInfo({ poll, view = 'owner' }: { poll: PollDetail; view?: 'owner' | 'admin' }) {
    // โพลที่ปิดก่อนกำหนดโชว์เวลาปิดจริงคู่กับกำหนดเดิม (System flow §7)
    const closeValue = poll.closedEarly && poll.closedAt
        ? `ปิดจริง ${formatThaiDateTime(poll.closedAt)} · กำหนดเดิม ${formatThaiDateTime(poll.closeTime)}`
        : `${formatThaiDateTime(poll.closeTime)} (${formatTimeLeftShort(poll.closeTime)})`

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'ขอบเขตผู้ตอบ', value: <AudienceScopeView label={audienceLabel(poll)} scope={audienceScope(poll)} /> },
        { label: 'เวลาปิดโหวต', value: closeValue },
    ]
    if (poll.closedEarly && poll.closeReason) rows.push({ label: 'เหตุผลที่ปิดก่อนกำหนด', value: poll.closeReason })
    if (view === 'admin' && poll.closedBy) rows.push({ label: 'ปิดโดย', value: poll.closedBy })
    rows.push({ label: 'การลงคะแนนซ้ำ', value: poll.allowRepeat || poll.scope === 'C' ? 'ลงคะแนนซ้ำได้' : 'หนึ่งคนหนึ่งเสียง' })
    rows.push({
        label: 'แสดงผลแบบเรียลไทม์',
        value: REALTIME_EDITABLE.includes(poll.type)
            ? <RealtimeSwitch pollId={poll.id} realtime={poll.realtime} />
            : poll.realtime ? 'เปิด' : 'ปิด',
    })
    if (poll.identifySender && poll.scope !== 'C') {
        rows.push({ label: 'ระบุคนส่ง', value: 'เปิด · เจ้าของโพลเห็นรหัสของผู้ตอบในคำตอบรายชุดและไฟล์ส่งออก' })
    }

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
