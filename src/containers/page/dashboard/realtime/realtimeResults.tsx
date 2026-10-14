'use client'
import React, { useEffect, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { isChoiceQuestion, type PollResults } from '@/lib/pollResultTypes'
import type { ResultView } from '@/lib/resultView'
import { ViewToggleBar } from '@/containers/page/dashboard/components/viewToggleBar'
import { ChoiceResults } from '@/containers/page/dashboard/components/questionCard'
import { Countdown } from './countdown'

const POLL_INTERVAL = 5_000

// ยังไม่มี websocket/SSE ใน backend ชั่วคราว จึงดึงผลซ้ำทุก 5 วินาที
// ข้ามรอบตอนแท็บไม่ได้เปิดดูอยู่ และหยุดเมื่อโพลปิดแล้ว (ผลไม่เปลี่ยนอีก)
function useLiveResults(initial: PollResults) {
    const [results, setResults] = useState(initial)
    const live = results.status === 'VOTING'

    useEffect(() => {
        if (!live) return
        let controller: AbortController | null = null
        const tick = async () => {
            if (document.hidden) return
            controller?.abort()
            controller = new AbortController()
            try {
                const res = await fetch(`/api/polls/${initial.pollId}/results`, { signal: controller.signal, cache: 'no-store' })
                if (res.ok) setResults(await res.json())
            } catch {
                // พลาดรอบเดียวไม่เป็นไร รอบถัดไปจะดึงใหม่
            }
        }
        const id = setInterval(tick, POLL_INTERVAL)
        return () => {
            clearInterval(id)
            controller?.abort()
        }
    }, [live, initial.pollId])

    return results
}

// เก็บมุมมองและข้อที่เลือกไว้ใน query (?view=list,pie&q=1) ให้รีเฟรช/แชร์ลิงก์แล้วได้หน้าจอเดิม
function writeQuery(views: ResultView[], position: number | undefined) {
    const params = new URLSearchParams(window.location.search)
    params.set('view', views.join(','))
    if (position !== undefined) params.set('q', String(position))
    window.history.replaceState(null, '', `?${params}`)
}

export function RealtimeResults({ title, initial, initialViews, initialPosition }: {
    title: string
    initial: PollResults
    initialViews: ResultView[]
    initialPosition?: number
}) {
    const results = useLiveResults(initial)
    const choices = results.questions.filter(isChoiceQuestion)
    const [views, setViews] = useState<ResultView[]>(initialViews)
    const [position, setPosition] = useState(
        choices.some((q) => q.position === initialPosition) ? initialPosition : choices[0]?.position,
    )
    const question = choices.find((q) => q.position === position)
    const items = choices.map((q) => ({ value: String(q.position), label: `ข้อ ${q.order} ${q.title}` }))

    return (
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-5 pb-8'>
            <header className='flex flex-col gap-1'>
                <h1 className='font-heading text-3xl font-bold break-words'>{title}</h1>
                <Countdown closeAt={results.closeAt} closed={results.status !== 'VOTING'} />
            </header>

            {choices.length === 0 ? (
                <p className='rounded-2xl bg-inner-bg px-4 py-6 text-center text-ink-500'>โพลนี้ไม่มีคำถามแบบเลือก จึงไม่มีกราฟให้ดู</p>
            ) : (
                <>
                    <Select
                        items={items}
                        value={String(position)}
                        onValueChange={(v) => {
                            if (!v) return
                            setPosition(Number(v))
                            writeQuery(views, Number(v))
                        }}
                    >
                        <SelectTrigger className='h-11! w-full text-base' aria-label='เลือกคำถาม'>
                            <SelectValue className='truncate' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {items.map((item) => (
                                    <SelectItem key={item.value} value={item.value} className='text-base'>
                                        <span className='truncate'>{item.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {question && (
                        <>
                            <ViewToggleBar
                                views={views}
                                onChange={(next) => {
                                    setViews(next)
                                    writeQuery(next, position)
                                }}
                                total={question.respondentCount}
                            />
                            <div aria-live='polite' className='sr-only'>
                                ตอบแล้ว {question.respondentCount} คน
                            </div>
                            <ChoiceResults question={question} views={views} />
                        </>
                    )}
                </>
            )}
        </div>
    )
}

