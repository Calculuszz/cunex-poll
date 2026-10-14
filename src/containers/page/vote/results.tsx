import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { CURRENT_USER } from '@/lib/currentUser'
import { getVoterResults } from '@/lib/voterResults'
import { cn } from '@/lib/utils'
import { VoterHeader } from './components/voterHeader'
import { VoterResults } from './voterResults'

// /(slug)/results ดูได้เมื่อโพลปิดแล้ว หรือโพลเปิด realtime และผู้ใช้ส่งคำตอบแล้ว
export async function VoteResultsPage({ slug, submitted }: { slug: string; submitted: boolean }) {
    const results = await getVoterResults(slug, CURRENT_USER.studentId)
    if (results === 'not_found') notFound()
    if (results === 'forbidden') redirect(`/${slug}`)

    return (
        <>
            <VoterHeader />
            <VoterResults initial={results} justSubmitted={submitted} />
            <Link
                href='/explore'
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 mb-8 h-11 w-full rounded-full border-primary font-heading text-base font-bold text-primary')}
            >
                กลับไปหน้าโพลที่ตอบได้
            </Link>
        </>
    )
}
