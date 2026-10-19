import React from 'react'
import { redirect } from 'next/navigation'
import { isApiError } from '@/api'
import { formatThaiDateTime } from '@/lib/thaiDate'
import { fromBallot, questionsOf } from '@/lib/voteForm'
import { loadVoterPoll } from './loadVoter'
import { VoterHeader } from './components/voterHeader'
import { QuestionBlock } from './components/questionBlock'

// คำตอบที่ส่งไปแล้วแบบอ่านอย่างเดียว (GET /polls/:id/ballot) · แก้คำตอบทำจากหน้าแรกของโพลเมื่อโพลเปิดให้แก้
export async function MyAnswersPage({ slug }: { slug: string }) {
    const { poll, api } = await loadVoterPoll(slug, `/${slug}/my-answers`)
    let ballot
    try {
        ballot = await api.ballot.get(slug)
    } catch (err) {
        if (isApiError(err, 'NO_BALLOT')) redirect(`/${slug}`)
        throw err
    }
    const questions = questionsOf(poll.items)
    const answers = fromBallot(questions, ballot)

    return (
        <>
            <VoterHeader link={{ href: `/${slug}`, label: 'กลับไปหน้าแรก' }} />
            <div className='flex flex-col gap-6 pb-10'>
                <div className='flex flex-col gap-1'>
                    <h1 className='font-heading text-3xl font-bold'>ดูคำตอบของคุณ</h1>
                    <p className='text-ink-500'>บันทึกคำตอบของคุณเรียบร้อยแล้ว ขอบคุณที่ร่วมแสดงความคิดเห็น</p>
                </div>
                <div className='flex flex-col gap-2 rounded-2xl border border-primary bg-card p-4'>
                    <span className='text-sm text-ink-500'>ชื่อโพล</span>
                    <span className='font-heading text-xl font-bold break-words'>{poll.title}</span>
                    <hr />
                    {ballot.submittedAt && <span className='text-sm text-ink-500'>ส่งเมื่อ: {formatThaiDateTime(ballot.submittedAt)}</span>}
                </div>
                {questions.map((q) => (
                    <div key={q.key} className='rounded-2xl border bg-card p-4'>
                        <QuestionBlock question={q} value={answers[q.key]} readOnly />
                    </div>
                ))}
            </div>
        </>
    )
}
