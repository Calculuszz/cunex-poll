import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CircleCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatThaiDateTime } from '@/lib/thaiDate'
import { cn } from '@/lib/utils'
import { loadVoterPoll } from './loadVoter'
import { VoterHeader } from './components/voterHeader'

const pill = 'h-11 w-full rounded-full font-heading text-base font-bold'

// หน้าขอบคุณหลังส่ง (โพลที่ไม่ได้เปิด realtime หรือไม่ได้เผยแพร่ผล)
export async function VoteDonePage({ slug }: { slug: string }) {
    const { poll } = await loadVoterPoll(slug, `/${slug}/done`)
    if (!poll.submitted) redirect(`/${slug}`)
    // ดูผลได้แล้ว (realtime + เผยแพร่ หรือปิดแล้ว) ไม่ต้องผ่านหน้านี้
    if (poll.canViewResults) redirect(`/${slug}/results`)

    return (
        <>
            <VoterHeader />
            <div className='flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center'>
                <CircleCheck className='size-20 text-primary' />
                <h1 className='font-heading text-3xl font-bold'>ขอบคุณที่ร่วมโหวต</h1>
                <p className='text-ink-500'>บันทึกคำตอบของคุณเรียบร้อยแล้ว</p>
                <p className='text-sm text-ink-500'>
                    {poll.resultsPublished
                        ? poll.closesAt ? `ผลโหวตจะเปิดให้ดูหลังปิดโหวต ${formatThaiDateTime(poll.closesAt)}` : 'ผลโหวตจะเปิดให้ดูหลังปิดโหวต'
                        : 'เจ้าของโพลไม่ได้เผยแพร่ผลโหวต'}
                </p>
                <div className='mt-6 flex w-full max-w-sm flex-col gap-2'>
                    <Link href={`/${slug}/my-answers`} className={cn(buttonVariants(), pill)}>ดูคำตอบของคุณ</Link>
                    <Link href='/explore' className={cn(buttonVariants({ variant: 'outline' }), pill, 'border-primary text-primary')}>
                        กลับไปหน้าโพลที่ตอบได้
                    </Link>
                </div>
            </div>
        </>
    )
}
