import React, { type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IPollCardDTO } from '@/dtos/pollcardDto'
import { SCOPE_LABEL, STATUS_LABEL, formatCloseTime } from '@/lib/pollLabels'

export function PollCard({ poll, action }: { poll: IPollCardDTO; action?: ReactNode }) {
    return (
        <Card size='sm' className='h-full'>
            <CardContent className='flex h-full flex-col gap-3'>
                <div className='flex flex-wrap gap-1'>
                    <Badge variant={poll.type === 'VOTING' ? 'default' : 'secondary'}>{STATUS_LABEL[poll.type]}</Badge>
                    <Badge variant='outline'>{SCOPE_LABEL[poll.scope]}</Badge>
                    {poll.realtime && <Badge variant='outline'>เรียลไทม์</Badge>}
                </div>
                <div className='flex flex-col gap-1'>
                    <h2 className='font-heading text-xl font-bold leading-snug line-clamp-2'>{poll.title}</h2>
                    <p className='text-base text-ink-500 line-clamp-2'>{poll.desc}</p>
                </div>
                <div className='mt-auto flex items-center justify-between gap-2 border-t pt-3 text-sm text-ink-500'>
                    <span>{poll.question} คำถาม</span>
                    <span>ปิด {formatCloseTime(poll.closeTime)}</span>
                </div>
                {action}
            </CardContent>
        </Card>
    )
}
