'use client'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api, errorMessage } from '@/api'
import type { Element, ResponsePage } from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatThaiDateTime } from '@/lib/thaiDate'

const PAGE_SIZE = 10

// คำตอบรายชุด (GET /polls/:id/responses [เสนอเพิ่ม]) ใหม่สุดก่อน แบ่งหน้าด้วย cursor
// เก็บ cursor ของหน้าที่ผ่านมาไว้เป็น stack เพื่อย้อนกลับได้ (cursor ไปข้างหน้าได้ทางเดียว)
// ฝั่งเจ้าของไม่มีรหัสผู้ตอบ ยกเว้นโพลที่เปิด "ระบุคนส่ง" · แอดมินเห็นเสมอ · ขอ withIdentity แล้ว API ตัดสินเอง
export function ResponseList({ pollId, elements, withIdentity }: { pollId: string; elements: Element[]; withIdentity: boolean }) {
    const [cursors, setCursors] = useState<(string | null)[]>([null])
    const [data, setData] = useState<ResponsePage | null>(null)
    const [error, setError] = useState<string | null>(null)
    const cursor = cursors[cursors.length - 1]

    const questions = elements.filter(isQuestion).map((q, i) => ({ id: q.id!, order: i + 1, title: q.title ?? '' }))
    const labelOf = new Map(elements.filter(isChoice).flatMap((q) => q.options.map((o) => [o.id!, o.label] as const)))

    useEffect(() => {
        let alive = true
        api.polls.responses(pollId, { cursor, limit: PAGE_SIZE, withIdentity })
            .then((page) => { if (alive) { setData(page); setError(null) } })
            .catch((err) => { if (alive) setError(errorMessage(err, 'โหลดคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง')) })
        // เปลี่ยนหน้าเร็วๆ ไม่ให้ผลหน้าเก่ามาทับหน้าใหม่
        return () => { alive = false }
    }, [pollId, cursor, withIdentity])

    if (error) return <p role='alert' className='text-destructive'>{error}</p>
    // ระหว่างโหลดหน้าใหม่ยังโชว์หน้าเดิม ไม่กระพริบเป็นโครงว่าง ใช้ skeleton เฉพาะครั้งแรก
    if (!data) {
        return (
            <div className='flex flex-col gap-3' aria-busy aria-label='กำลังโหลด'>
                {[0, 1, 2].map((i) => <Skeleton key={i} className='h-28 w-full rounded-2xl' />)}
            </div>
        )
    }
    if (data.total === 0) return <p className='py-6 text-center text-ink-500'>ยังไม่มีผู้ตอบ</p>

    const page = cursors.length
    const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    return (
        <div className='flex flex-col gap-3'>
            <ul className='flex flex-col gap-3'>
                {data.items.map((row) => (
                    <li key={row.no} className='flex flex-col gap-2 rounded-2xl border bg-card p-4'>
                        <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                            <span className='font-heading text-lg font-bold'>#{row.no}</span>
                            <time dateTime={row.submittedAt} className='text-sm text-ink-500'>{formatThaiDateTime(row.submittedAt)}</time>
                        </div>
                        {data.identityVisible && (
                            <p className='text-sm'><span className='text-ink-500'>ผู้ตอบ: </span>{row.respondent ?? 'ไม่ระบุ'}</p>
                        )}
                        <dl className='flex flex-col gap-1.5'>
                            {questions.map((q) => {
                                const a = row.answers.find((x) => x.elementId === q.id)
                                const text = !a ? '' : 'text' in a ? a.text : a.optionIds.map((id) => labelOf.get(id) ?? '').join(', ')
                                return (
                                    <div key={q.id}>
                                        <dt className='text-sm text-ink-500 break-words'>ข้อ {q.order} {q.title}</dt>
                                        <dd className='pl-2 break-words whitespace-pre-line'>
                                            {text || <span className='text-ink-400'>ไม่ได้ตอบ</span>}
                                        </dd>
                                    </div>
                                )
                            })}
                        </dl>
                    </li>
                ))}
            </ul>
            <nav aria-label='เปลี่ยนหน้าคำตอบ' className='flex items-center justify-between gap-2'>
                <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setCursors((c) => c.slice(0, -1))}>
                    <ChevronLeft />
                    ก่อนหน้า
                </Button>
                <span className='text-sm text-ink-500 tabular-nums'>หน้า {page} จาก {pages} · {data.total.toLocaleString('th-TH')} ชุด</span>
                <Button variant='outline' size='sm' disabled={!data.nextCursor} onClick={() => setCursors((c) => [...c, data.nextCursor])}>
                    ถัดไป
                    <ChevronRight />
                </Button>
            </nav>
        </div>
    )
}
