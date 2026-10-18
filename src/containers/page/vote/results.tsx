import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isApiError } from '@/api'
import { buttonVariants } from '@/components/ui/button'
import { toResultsModel } from '@/lib/pollResultTypes'
import { cn } from '@/lib/utils'
import { loadVoterPoll } from './loadVoter'
import { VoterHeader } from './components/voterHeader'
import { VoterResults } from './voterResults'

// /(slug)/results ดูได้เมื่อโพลปิดแล้ว หรือโพลเปิด realtime และผู้ใช้ส่งคำตอบแล้ว (backend ตอบ 403 RESULTS_HIDDEN ถ้ายังไม่ได้)
export async function VoteResultsPage({ slug, submitted }: { slug: string; submitted: boolean }) {
    const { detail, api } = await loadVoterPoll(slug, `/${slug}/results`)
    let results
    try {
        results = await api.polls.results(slug)
    } catch (err) {
        if (isApiError(err, 'RESULTS_HIDDEN')) redirect(`/${slug}`)
        throw err
    }
    // เจ้าของ/แอดมินเปิดหน้านี้ได้ผลเต็ม แต่หน้านี้คือมุมมองผู้ตอบ จึงแสดงตามการตั้งค่าเผยแพร่เสมอ
    const model = toResultsModel(detail, results, detail.resultDisplay)

    return (
        <>
            <VoterHeader link={{ href: `/${slug}`, label: 'กลับไปหน้าแรก' }} />
            <VoterResults initial={model} views={detail.resultDisplay.views} elements={detail.elements} display={detail.resultDisplay} realtime={detail.settings.showResultsRealtime} justSubmitted={submitted} />
            <Link
                href='/explore'
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 mb-8 h-11 w-full rounded-full border-primary font-heading text-base font-bold text-primary')}
            >
                กลับไปหน้าโพลที่ตอบได้
            </Link>
        </>
    )
}
