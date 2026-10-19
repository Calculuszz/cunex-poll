import React from 'react'
import { redirect } from 'next/navigation'
import { ineligibleReason, paginate } from '@/lib/voteForm'
import { loadVoterPoll } from './loadVoter'
import { VoterHeader } from './components/voterHeader'
import { VoteStep } from './voteStep'

// /(slug)/q/(page) เข้าได้เฉพาะตอนยังโหวตได้อยู่ และมีฉบับร่างในเบราว์เซอร์ (VoteStep ตรวจ)
// ลิงก์ตรงตอนยังไม่เริ่ม/ส่งไปแล้ว/โพลปิด จะถูกพากลับหน้าแรกของโพลซึ่งบอกสถานะได้ถูก
export async function VoteStepPage({ slug, page }: { slug: string; page: string }) {
    const { me, poll } = await loadVoterPoll(slug, `/${slug}/q/${page}`)
    if (ineligibleReason(poll, me)) redirect(`/${slug}`)

    const pageIndex = Number(page) - 1
    const total = paginate(poll.items).length
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= total) redirect(`/${slug}/q/1`)

    return (
        <>
            <VoterHeader link={{ href: `/${slug}`, label: 'กลับไปหน้าแรก' }} guardPollId={poll.id} />
            <VoteStep poll={poll} pageIndex={pageIndex} />
        </>
    )
}
