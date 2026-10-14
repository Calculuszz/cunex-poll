import React from 'react'
import { Badge } from '@/components/ui/badge'
import { SCOPE_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/pollLabels'
import type { IPollCardDTO } from '@/dtos/pollcardDto'
import { cn } from '@/lib/utils'

// แถวชิปบอกสถานะ ขอบเขต และโหมดเรียลไทม์ของโพล
// สีชิปสถานะใช้ชุดเดียวกับการ์ดโพล (STATUS_BADGE_CLASS)
export function PollStatusTags({ status, scope, realtime }: {
    status: IPollCardDTO['type']
    scope: IPollCardDTO['scope']
    realtime: boolean
}) {
    const chip = 'h-6 px-2.5 text-sm'
    return (
        <div className='flex flex-wrap gap-1.5'>
            <Badge className={cn(chip, STATUS_BADGE_CLASS[status])}>{status === 'DONE' ? 'ปิดโหวตแล้ว' : STATUS_LABEL[status]}</Badge>
            <Badge variant='disable' className={chip}>{SCOPE_LABEL[scope]}</Badge>
            {realtime && <Badge variant='disable' className={chip}>เรียลไทม์</Badge>}
        </div>
    )
}
