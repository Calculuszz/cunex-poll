import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { CURRENT_USER } from '@/lib/currentUser'
import { formatThaiDateTime } from '@/lib/thaiDate'
import { questionsOf } from '@/lib/voteForm'
import { getMyLastSubmission, getVoterPoll } from '@/lib/votes'
import { VoterHeader } from './components/voterHeader'
import { QuestionBlock } from './components/questionBlock'

// คำตอบที่ส่งไปแล้วแบบอ่านอย่างเดียว ไม่มีปุ่มแก้ เพราะส่งแล้วถือเป็นคะแนนที่นับไปแล้ว
export async function MyAnswersPage({ slug }: { slug: string }) {
    const poll = await getVoterPoll(slug)
    if (!poll) notFound()
    const mine = await getMyLastSubmission(poll, CURRENT_USER.studentId)
    if (!mine) redirect(`/${slug}`)

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
                    <span className='text-sm text-ink-500'>ส่งเมื่อ: {formatThaiDateTime(mine.submittedAt)}</span>
                </div>
                {questionsOf(poll.items).map((q) => (
                    <div key={q.key} className='rounded-2xl border bg-card p-4'>
                        <QuestionBlock question={q} value={mine.answers[q.key]} readOnly />
                    </div>
                ))}
            </div>
        </>
    )
}
