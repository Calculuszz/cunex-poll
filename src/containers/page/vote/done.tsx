import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CircleCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CURRENT_USER } from '@/lib/currentUser'
import { formatThaiDateTime } from '@/lib/thaiDate'
import { getMyResponse, getVoterPoll } from '@/lib/votes'
import { cn } from '@/lib/utils'
import { VoterHeader } from './components/voterHeader'

const pill = 'h-11 w-full rounded-full font-heading text-base font-bold'

// หน้าขอบคุณหลังส่ง (โพลที่ไม่ได้เปิด realtime หรือไม่ได้เผยแพร่ผล)
export async function VoteDonePage({ slug }: { slug: string }) {
    const poll = await getVoterPoll(slug)
    if (!poll) notFound()
    const me = await getMyResponse(poll, CURRENT_USER.studentId)
    if (!me.submittedAt) redirect(`/${slug}`)
    // โพลที่เปิด realtime และเผยแพร่ผล ดูผลได้ทันทีหลังส่ง จึงไม่ต้องผ่านหน้านี้
    if (poll.realtime && poll.resultsPublished) redirect(`/${slug}/results`)

    return (
        <>
            <VoterHeader />
            <div className='flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center'>
                <CircleCheck className='size-20 text-primary' />
                <h1 className='font-heading text-3xl font-bold'>ขอบคุณที่ร่วมโหวต</h1>
                <p className='text-ink-500'>บันทึกคำตอบของคุณเรียบร้อยแล้ว</p>
                <p className='text-sm text-ink-500'>
                    {poll.resultsPublished ? `ผลโหวตจะเปิดให้ดูหลังปิดโหวต ${formatThaiDateTime(poll.closeAt)}` : 'เจ้าของโพลไม่ได้เผยแพร่ผลโหวต'}
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
