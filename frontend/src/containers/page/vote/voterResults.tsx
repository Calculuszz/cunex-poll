'use client'
import React from 'react'
import { CircleCheck } from 'lucide-react'
import { api } from '@/api'
import type { Element, ResultDisplay, ResultView } from '@/api/types'
import { toResultsModel, type ResultsModel } from '@/lib/pollResultTypes'
import { applyDisplay } from '@/lib/resultDisplay'
import { useLiveResults } from '@/hooks/useLiveResults'
import { DisplayChoiceResults } from '@/containers/page/dashboard/components/questionCard'
import { cn } from '@/lib/utils'

// ผลโหวตฝั่งผู้ตอบ แสดงตามที่เจ้าของตั้งไว้ (ข้อ มุมมอง ตัวเลข) ใช้ component ชุดเดียวกับหน้าเจ้าของ
export function VoterResultsView({ results, views, justSubmitted, className, live = results.status === 'open' }: {
    results: ResultsModel
    views: ResultView[]
    justSubmitted?: boolean
    className?: string
    // ตัวอย่างในหน้าตั้งค่าของโพลที่ไม่เปิด realtime ส่ง false ให้หน้าตาตรงกับที่ผู้ตอบเห็นจริงหลังปิดโหวต
    live?: boolean
}) {
    const choices = results.questions.filter((q) => q.type !== 'text_question')
    return (
        <div className={cn('flex flex-col gap-6', className)}>
            {justSubmitted && (
                <p role='status' className='flex items-center justify-center gap-2 rounded-xl bg-green-100 px-4 py-3 text-green-200'>
                    <CircleCheck className='size-5 shrink-0' />
                    บันทึกคำตอบของคุณเรียบร้อยแล้ว ขอบคุณที่ร่วมโหวต
                </p>
            )}
            <div className='flex flex-col items-center gap-1 text-center'>
                <h1 className='font-heading text-3xl font-bold'>{live ? 'ผลโหวตเรียลไทม์' : 'ผลโหวต'}</h1>
                <p className='text-sm text-ink-500'>
                    {live ? 'อัปเดตอัตโนมัติระหว่างเปิดโหวต' : 'ผลสุดท้ายหลังปิดโหวต'}
                    {results.totalRespondents !== null && ` · ตอบแล้ว ${results.totalRespondents.toLocaleString('th-TH')} คน`}
                </p>
            </div>
            {choices.length === 0 && <p className='text-center text-ink-500'>ยังไม่มีผลที่เปิดให้ดู</p>}
            {choices.map((q) => (
                <section key={q.elementId} aria-labelledby={`r-${q.elementId}`} className='flex flex-col gap-3 rounded-2xl border bg-card p-4'>
                    <h2 id={`r-${q.elementId}`} className='font-heading text-lg font-bold break-words'>ข้อ {q.order} {q.title}</h2>
                    <DisplayChoiceResults
                        options={q.options}
                        total={q.respondentCount}
                        numbers={results.numbers}
                        views={views}
                        empty={q.options.every((o) => o.weight === 0)}
                    />
                </section>
            ))}
        </div>
    )
}

export function VoterResults({ initial, views, elements, display, realtime, justSubmitted }: {
    initial: ResultsModel
    views: ResultView[]
    elements: Element[]
    display: ResultDisplay
    realtime: boolean
    justSubmitted: boolean
}) {
    const poll = { id: initial.pollId, status: initial.status, elements }
    // อัปเดตสดเฉพาะโพลเรียลไทม์ที่ยังเปิดอยู่ (เจ้าของ/แอดมินเปิดหน้านี้ก่อนปิดได้ แต่ไม่ใช่ผลเรียลไทม์)
    const live = realtime && initial.status === 'open'
    const results = useLiveResults(initial, live, async (signal) =>
        toResultsModel(poll, await api.polls.results(poll.id, 'none', signal), display))
    // ผู้ตอบได้ผลที่ backend กรองแล้ว · เจ้าของ/แอดมินที่เปิดหน้านี้ได้ผลเต็ม จึงกรองซ้ำให้เห็นแบบเดียวกับผู้ตอบ
    return <VoterResultsView results={applyDisplay(results, display)} views={views} live={live} justSubmitted={justSubmitted} />
}
