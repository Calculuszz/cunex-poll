import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { AudienceType, PollStatus } from '@/api/types'
import { AUDIENCE_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/pollLabels'
import { cn } from '@/lib/utils'

// แถวชิปบอกสถานะ ขอบเขต และโหมดเรียลไทม์ของโพล
// สีชิปสถานะใช้ชุดเดียวกับการ์ดโพล (STATUS_BADGE_CLASS)
export function PollStatusTags({ status, audience, realtime }: { status: PollStatus; audience: AudienceType; realtime: boolean }) {
    const chip = 'h-6 px-2.5 text-sm'
    return (
        <div className='flex flex-wrap gap-1.5'>
            <Badge className={cn(chip, STATUS_BADGE_CLASS[status])}>{status === 'closed' ? 'ปิดโหวตแล้ว' : STATUS_LABEL[status]}</Badge>
            <Badge variant='disable' className={chip}>{AUDIENCE_LABEL[audience]}</Badge>
            {realtime && <Badge variant='disable' className={chip}>เรียลไทม์</Badge>}
        </div>
    )
}
