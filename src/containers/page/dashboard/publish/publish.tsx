import React from 'react'
import { redirect } from 'next/navigation'
import { getServerApi, loadOrNotFound } from '@/api/server'
import { toResultsModel } from '@/lib/pollResultTypes'
import { PublishSettings } from './publishSettings'

// หน้าตั้งค่าการเผยแพร่ผลโหวตให้ผู้ตอบ (PUT /result-display) เฉพาะเจ้าของ
// ตั้งได้เฉพาะโพลที่เปิดโหวตแล้ว เพราะก่อนนั้นยังไม่มีผลให้เผยแพร่
export async function PublishSettingsPage({ slug }: { slug: string }) {
    const api = await getServerApi()
    const poll = await loadOrNotFound(() => api.polls.get(slug), `/dashboard/${slug}/publish`)
    if (!poll.isOwner || (poll.status !== 'open' && poll.status !== 'closed')) redirect(`/dashboard/${slug}`)
    const results = await api.polls.results(slug)

    return (
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
            <header className='flex flex-col gap-1'>
                <h1 className='font-heading text-3xl font-bold'>ตั้งค่าการเผยแพร่ผล</h1>
                <p className='break-words text-ink-500'>{poll.title}</p>
            </header>
            <PublishSettings
                pollId={poll.id}
                realtime={poll.settings.showResultsRealtime}
                elements={poll.elements}
                initialSettings={poll.resultDisplay}
                initialResults={toResultsModel(poll, results)}
            />
        </div>
    )
}
