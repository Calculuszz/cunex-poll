import React from 'react'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { ExploreVoteState } from '@/lib/votes'
import { cn } from '@/lib/utils'

const btn = 'flex-1 px-4 py-5 font-heading text-base font-bold'

// ปุ่มท้ายการ์ดในหน้ารวมโพล เปลี่ยนตามว่าผู้ใช้เคยตอบโพลนี้ไปแค่ไหน (ชุดเดียวกับหน้าแรกของโพล)
export function ExploreActions({ pollId, state }: { pollId: string; state?: ExploreVoteState }) {
    const primary = (href: string, label: string) => (
        <Link href={href} className={cn(buttonVariants(), btn)}>{label}</Link>
    )
    const outline = (href: string, label: string, icon?: React.ReactNode) => (
        <Link href={href} className={cn(buttonVariants({ variant: 'outline' }), btn, 'border-primary text-primary')}>{icon}{label}</Link>
    )

    let main: React.ReactNode
    if (state?.hasDraft) main = primary(`/${pollId}`, 'โหวตต่อ')
    else if (state?.hasSubmitted && state.repeat) main = primary(`/${pollId}`, 'โหวตอีกครั้ง')
    else if (state?.hasSubmitted) main = outline(`/${pollId}/my-answers`, 'ดูคำตอบของคุณ')
    else main = primary(`/${pollId}`, 'เริ่มทำโพล')

    return (
        <div className='flex flex-col gap-1.5'>
            <div className='flex gap-2'>
                {state?.canSeeResults && outline(`/${pollId}/results`, 'ดูผลโหวต', <BarChart3 />)}
                {main}
            </div>
            {/* ส่งแล้วแต่ยังดูผลไม่ได้ บอกเหตุผลไว้ คนจะได้ไม่ต้องหาปุ่ม */}
            {state?.hasSubmitted && !state.canSeeResults && (
                <p className='text-center text-sm text-ink-500'>
                    {state.published ? 'ผลโหวตเปิดให้ดูหลังปิดโหวต' : 'เจ้าของโพลไม่ได้เผยแพร่ผลโหวต'}
                </p>
            )}
        </div>
    )
}
