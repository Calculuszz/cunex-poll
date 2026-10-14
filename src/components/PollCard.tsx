import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IPollCardDTO } from '@/dtos/pollcardDto'
import { SCOPE_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL, formatCloseTime } from '@/lib/pollLabels'
import { cn } from '@/lib/utils'

// ถ้าส่ง href มา ทั้งการ์ดกดได้ผ่านลิงก์ที่ยืดเต็มการ์ด (stretched link) ส่วน action อยู่เหนือลิงก์เพื่อให้กดปุ่มในการ์ดได้
// ไม่ส่ง href จะเป็นการ์ดที่กดไม่ได้ (เช่นหน้า explore)
export function PollCard({ poll, action, href }: { poll: IPollCardDTO; action?: ReactNode; href?: string }) {
    return (
        <Card size='sm' className={cn('relative h-full', href && 'focus-within:ring-2 focus-within:ring-ring')}>
            <CardContent className='flex h-full flex-col gap-3'>
                <div className='flex flex-wrap gap-1'>
                    <Badge className={STATUS_BADGE_CLASS[poll.type]}>{STATUS_LABEL[poll.type]}</Badge>
                    <Badge variant='outline'>{SCOPE_LABEL[poll.scope]}</Badge>
                    {poll.realtime && <Badge variant='outline'>เรียลไทม์</Badge>}
                </div>
                <div className='flex flex-col gap-1'>
                    <h2 className='font-heading text-xl font-bold leading-snug line-clamp-2'>
                        {href ? (
                            <Link
                                href={href}
                                className='outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring'
                            >
                                {poll.title}
                            </Link>
                        ) : poll.title}
                    </h2>
                    <p className='text-base text-ink-500 line-clamp-2'>{poll.desc}</p>
                </div>
                <div className='mt-auto flex items-center justify-between gap-2 border-t pt-3 text-sm text-ink-500'>
                    <span>{poll.question} คำถาม</span>
                    <span>ปิด {formatCloseTime(poll.closeTime)}</span>
                </div>
                {action && <div className='relative z-10'>{action}</div>}
            </CardContent>
        </Card>
    )
}
