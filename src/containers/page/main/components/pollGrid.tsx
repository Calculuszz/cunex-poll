import React, { type ReactNode } from 'react'
import { PollCard } from '@/components/PollCard'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// linkTo ไม่ส่ง = การ์ดกดไม่ได้ (เช่นหน้า explore)
export function PollGrid({ polls, renderAction, linkTo }: {
    polls: IPollCardDTO[]
    renderAction?: (poll: IPollCardDTO) => ReactNode
    linkTo?: (poll: IPollCardDTO) => string
}) {
    if (polls.length === 0) {
        return (
            <div className='py-12 text-center text-base text-ink-500'>
                ยังไม่มีโพลในหมวดนี้
            </div>
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
