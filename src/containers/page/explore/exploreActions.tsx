import React from 'react'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import type { PollSummary } from '@/api/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const btn = 'flex-1 px-4 py-5 font-heading text-base font-bold'

// ปุ่มท้ายการ์ดในหน้ารวมโพล เปลี่ยนตามสถานะ ballot ของผู้ใช้ (myBallot) และฉบับร่างคำตอบที่ server
// ปุ่มดูผลโผล่เมื่อมีโอกาสดูได้ (ปิดแล้ว หรือเรียลไทม์+ตอบแล้ว) ถ้าเจ้าของไม่เผยแพร่ หน้าผลจะพากลับหน้าแรกของโพล
export function ExploreActions({ poll }: { poll: PollSummary }) {
    const draft = poll.myBallot?.hasDraft ?? false
    const repeat = poll.allowRepeat ?? false
    const submitted = poll.myBallot?.submitted ?? false
    const canEdit = poll.myBallot?.canEdit ?? false
    const closed = poll.status === 'closed'

    const primary = (href: string, label: string) => <Link href={href} className={cn(buttonVariants(), btn)}>{label}</Link>
    const outline = (href: string, label: string, icon?: React.ReactNode) => (
        <Link href={href} className={cn(buttonVariants({ variant: 'outline' }), btn, 'border-primary text-primary')}>{icon}{label}</Link>
    )

    let main: React.ReactNode = null
    if (closed) main = submitted ? outline(`/${poll.id}/my-answers`, 'ดูคำตอบของคุณ') : null
    else if (draft) main = primary(`/${poll.id}`, submitted && !repeat ? 'แก้คำตอบต่อ' : 'โหวตต่อ')
    else if (submitted && repeat) main = primary(`/${poll.id}`, 'โหวตอีกครั้ง')
    else if (submitted && canEdit) main = primary(`/${poll.id}`, 'แก้คำตอบ')
    else if (submitted) main = outline(`/${poll.id}/my-answers`, 'ดูคำตอบของคุณ')
    else main = primary(`/${poll.id}`, 'เริ่มทำโพล')

    const mayViewResults = closed || (poll.showResultsRealtime && submitted)
    return (
        <div className='flex flex-col gap-1.5'>
            <div className='flex gap-2'>
                {mayViewResults && outline(`/${poll.id}/results`, 'ดูผลโหวต', <BarChart3 />)}
                {main}
            </div>
            {/* ส่งแล้วแต่ยังดูผลไม่ได้ บอกเหตุผลไว้ คนจะได้ไม่ต้องหาปุ่ม */}
            {submitted && !mayViewResults && <p className='text-center text-sm text-ink-500'>ผลโหวตเปิดให้ดูหลังปิดโหวต</p>}
        </div>
    )
}
