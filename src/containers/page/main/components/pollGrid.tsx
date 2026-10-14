import React, { type ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { PollCard } from '@/components/PollCard'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

export type PollGridEmpty = { title: string; description: string; action?: ReactNode }

const DEFAULT_EMPTY: PollGridEmpty = { title: 'ยังไม่มีโพลในหมวดนี้', description: 'โพลที่ตรงกับหมวดนี้จะแสดงที่นี่' }

// linkTo ไม่ส่ง = การ์ดกดไม่ได้ (เช่นหน้า explore)
// empty ให้แต่ละแท็บบอกเองว่าทำไมถึงว่างและทำอะไรต่อได้ ไม่ใช่ข้อความเดียวกันทุกหน้า
export function PollGrid({ polls, renderAction, linkTo, empty = DEFAULT_EMPTY }: {
    polls: IPollCardDTO[]
    renderAction?: (poll: IPollCardDTO) => ReactNode
    linkTo?: (poll: IPollCardDTO) => string
    empty?: PollGridEmpty
}) {
    if (polls.length === 0) {
        return (
            <Empty className='py-12'>
                <EmptyHeader>
                    <EmptyMedia className='size-16 rounded-full bg-inner-bg text-ink-500'>
                        <FileText className='size-8' />
                    </EmptyMedia>
                    <EmptyTitle className='font-heading text-xl font-bold'>{empty.title}</EmptyTitle>
                    <EmptyDescription className='text-base text-ink-500'>{empty.description}</EmptyDescription>
                </EmptyHeader>
                {empty.action && <EmptyContent>{empty.action}</EmptyContent>}
            </Empty>
        )
    }

    return (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} action={renderAction?.(poll)} href={linkTo?.(poll)} />
            ))}
        </div>
    )
}
