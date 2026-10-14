import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { CURRENT_USER } from '@/lib/currentUser'
import { paginate } from '@/lib/voteForm'
import { checkEligibility, getMyResponse, getVoterPoll } from '@/lib/votes'
import { VoterHeader } from './components/voterHeader'
import { VoteStep } from './voteStep'

// /(slug)/q/(page) เข้าได้เฉพาะตอนมีฉบับร่าง (กดเริ่มโหวตแล้ว) และยังโหวตได้อยู่
// ลิงก์ตรงตอนยังไม่เริ่ม/ส่งไปแล้ว/โพลปิด จะถูกพากลับหน้าแรกของโพลซึ่งบอกสถานะได้ถูก
export async function VoteStepPage({ slug, page }: { slug: string; page: string }) {
    const poll = await getVoterPoll(slug)
    if (!poll) notFound()
    const me = await getMyResponse(poll, CURRENT_USER.studentId)
    const reason = await checkEligibility(poll, CURRENT_USER.studentId, me.submittedAt !== null)
    if (me.status !== 'draft' || reason) redirect(`/${slug}`)

    const pageIndex = Number(page) - 1
    const total = paginate(poll.items).length
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= total) redirect(`/${slug}/q/1`)

    return (
        <>
            <VoterHeader link={{ href: `/${slug}`, label: 'กลับไปหน้าแรก' }} guardPollId={poll.id} />
            <VoteStep poll={poll} pageIndex={pageIndex} initialAnswers={me.answers} lastSavedAt={me.lastSavedAt} />
        </>
    )
}
