import React from 'react'
import { ineligibleReason } from '@/lib/voteForm'
import { loadVoteDraft, loadVoterPoll } from './loadVoter'
import { VoterHeader } from './components/voterHeader'
import { AnonymityNote } from './components/anonymityNote'
import { PollIntroCard } from './components/pollIntroCard'

// หน้าแรกของโพล /(slug) — ลิงก์/QR ที่แชร์ชี้มาที่นี่
// โพลที่ไม่มีหรือผู้ใช้อยู่นอกกลุ่มผู้ตอบ API ตอบ 404 จึงไปหน้า not found (ไม่บอกว่าโพลมีอยู่จริงไหม)
export async function VoteIntroPage({ slug }: { slug: string }) {
    const { me, poll, api } = await loadVoterPoll(slug, `/${slug}`)
    const draft = await loadVoteDraft(api, poll)
    return (
        <>
            <VoterHeader link={{ href: '/explore', label: 'ไปที่หน้าโพลที่ตอบได้' }} />
            <PollIntroCard poll={poll} reason={ineligibleReason(poll, me)} draft={draft} />
            <AnonymityNote identified={poll.identifySender} className='mt-4' />
        </>
    )
}
