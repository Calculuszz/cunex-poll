import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PollSummary } from '@/api/types'
import { AUDIENCE_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL, cardCloseLabel } from '@/lib/pollLabels'
import { cn } from '@/lib/utils'

// ถ้าส่ง href มา ทั้งการ์ดกดได้ผ่านลิงก์ที่ยืดเต็มการ์ด (stretched link) ส่วน action อยู่เหนือลิงก์เพื่อให้กดปุ่มในการ์ดได้
// ไม่ส่ง href จะเป็นการ์ดที่กดไม่ได้ (เช่นหน้า explore)
export function PollCard({ poll, action, href }: { poll: PollSummary; action?: ReactNode; href?: string }) {
    return (
        <Card size='sm' className={cn('relative h-full', href && 'focus-within:ring-2 focus-within:ring-ring')}>
            {poll.coverImageUrl && (
                // รูปปกเป็นของตกแต่ง ชื่อโพลบอกเนื้อหาอยู่แล้ว · Card ตัด padding บนให้เองเมื่อ img เป็นลูกตัวแรก
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poll.coverImageUrl} alt='' loading='lazy' className='aspect-video w-full bg-inner-bg object-cover' />
            )}
            <CardContent className='flex h-full flex-col gap-3'>
                <div className='flex flex-wrap gap-1'>
                    <Badge className={STATUS_BADGE_CLASS[poll.status]}>{STATUS_LABEL[poll.status]}</Badge>
                    <Badge variant='outline'>{AUDIENCE_LABEL[poll.audience]}</Badge>
                    {poll.showResultsRealtime && <Badge variant='outline'>เรียลไทม์</Badge>}
                </div>
                <div className='flex flex-col gap-1'>
                    <h2 className='font-heading text-xl font-bold leading-snug line-clamp-2'>
                        {href ? (
                            <Link
                                href={href}
                                className='outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring'
                            >
                                {poll.title || 'ยังไม่ได้ตั้งชื่อโพล'}
                            </Link>
                        ) : poll.title}
                    </h2>
                    <p className='text-base text-ink-500 line-clamp-2'>{poll.description}</p>
                </div>
                <div className='mt-auto flex items-center justify-between gap-2 border-t pt-3 text-sm text-ink-500'>
                    <span>{poll.questionCount} คำถาม</span>
                    <span>{cardCloseLabel(poll)}</span>
                </div>
                {action && <div className='relative z-10'>{action}</div>}
            </CardContent>
        </Card>
    )
}
