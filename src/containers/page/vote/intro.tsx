import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CURRENT_USER } from '@/lib/currentUser'
import { paginate, resumePageIndex } from '@/lib/voteForm'
import { canViewResults, checkEligibility, getMyResponse, getVoterPoll } from '@/lib/votes'
import { cn } from '@/lib/utils'
import { VoterHeader } from './components/voterHeader'
import { AnonymityNote } from './components/anonymityNote'
import { PollIntroCard } from './components/pollIntroCard'

// หน้าแรกของโพล /(slug) — ลิงก์/QR ที่แชร์ชี้มาที่นี่ (System flow §4)
export async function VoteIntroPage({ slug }: { slug: string }) {
    const poll = await getVoterPoll(slug)
    if (!poll) notFound()
    const me = await getMyResponse(poll, CURRENT_USER.studentId)
    const reason = await checkEligibility(poll, CURRENT_USER.studentId, me.submittedAt !== null)

    return (
        <>
            <VoterHeader link={{ href: '/explore', label: 'ไปที่หน้าโพลที่ตอบได้' }} />
            {reason === 'OUT_OF_SCOPE' ? (
                <div className='flex flex-col items-center gap-3 rounded-2xl border bg-card px-4 py-10 text-center'>
                    <span className='flex size-16 items-center justify-center rounded-full bg-inner-bg text-ink-500'><UserX className='size-8' /></span>
                    <h1 className='font-heading text-xl font-bold'>คุณไม่อยู่ในกลุ่มผู้ตอบของโพลนี้</h1>
                    <p className='text-ink-500'>โพล “{poll.title}” เปิดให้เฉพาะ{poll.audienceLabel.replace(/^เฉพาะ/, '')}</p>
                    <Link href='/explore' className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 rounded-full font-heading text-base font-bold')}>
                        ไปที่หน้าโพลที่ตอบได้
                    </Link>
                </div>
            ) : (
                <PollIntroCard
                    poll={poll}
                    me={me}
                    reason={reason}
                    resumePage={resumePageIndex(paginate(poll.items), me.answers) + 1}
                    canSeeResults={canViewResults(poll, me)}
                />
            )}
            <AnonymityNote identified={poll.identifySender} className='mt-4' />
        </>
    )
}
