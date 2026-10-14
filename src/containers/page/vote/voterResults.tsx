'use client'
import React from 'react'
import { CircleCheck } from 'lucide-react'
import type { VoterResultsPayload } from '@/lib/resultDisplay'
import { useLiveResults } from '@/hooks/useLiveResults'
import { DisplayChoiceResults } from '@/containers/page/dashboard/components/questionCard'
import { cn } from '@/lib/utils'

// ผลโหวตฝั่งผู้ตอบ แสดงตามที่เจ้าของตั้งไว้ (ข้อ มุมมอง ตัวเลข) ใช้ component ชุดเดียวกับหน้าเจ้าของ
export function VoterResultsView({ results, justSubmitted, className, live = results.status === 'VOTING' }: {
    results: VoterResultsPayload
    justSubmitted?: boolean
    className?: string
    // ตัวอย่างในหน้าตั้งค่าของโพลที่ไม่เปิด realtime ส่ง false ให้หน้าตาตรงกับที่ผู้ตอบเห็นจริงหลังปิดโหวต
    live?: boolean
}) {
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
            {results.questions.length === 0 && <p className='text-center text-ink-500'>ยังไม่มีผลที่เปิดให้ดู</p>}
            {results.questions.map((q) => (
                <section key={q.position} aria-labelledby={`r-${q.position}`} className='flex flex-col gap-3 rounded-2xl border bg-card p-4'>
                    <h2 id={`r-${q.position}`} className='font-heading text-lg font-bold break-words'>ข้อ {q.order} {q.title}</h2>
                    <DisplayChoiceResults
                        options={q.options}
                        total={q.respondentCount}
                        numbers={results.numbers}
                        views={results.views}
                        empty={q.options.every((o) => o.weight === 0)}
                    />
                </section>
            ))}
        </div>
    )
}

export function VoterResults({ initial, justSubmitted }: { initial: VoterResultsPayload; justSubmitted: boolean }) {
    const results = useLiveResults(initial, `/api/polls/${initial.pollId}/public-results`)
    return <VoterResultsView results={results} justSubmitted={justSubmitted} />
}
