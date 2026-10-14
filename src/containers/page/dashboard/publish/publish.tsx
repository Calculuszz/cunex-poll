import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPollDetail } from '@/lib/polls'
import { getPollResults } from '@/lib/pollResults'
import { PublishSettings } from './publishSettings'

// หน้าตั้งค่าการเผยแพร่ผลโหวตให้ผู้ตอบ (แทนจอผลเรียลไทม์ของเจ้าของเดิม)
// ตั้งได้เฉพาะโพลที่เปิดโหวตแล้ว เพราะก่อนนั้นยังไม่มีผลให้เผยแพร่
export async function PublishSettingsPage({ slug }: { slug: string }) {
    const [poll, results] = await Promise.all([getPollDetail(slug), getPollResults(slug)])
    if (!poll || !results) notFound()
    if (poll.type !== 'VOTING' && poll.type !== 'DONE') redirect(`/dashboard/${slug}`)

    return (
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
            <header className='flex flex-col gap-1'>
                <h1 className='font-heading text-3xl font-bold'>ตั้งค่าการเผยแพร่ผล</h1>
                <p className='break-words text-ink-500'>{poll.title}</p>
            </header>
            <PublishSettings pollId={poll.id} realtime={poll.realtime} initialSettings={poll.resultDisplay} initialResults={results} />
        </div>
    )
}
