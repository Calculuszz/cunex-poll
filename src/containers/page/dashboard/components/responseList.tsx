'use client'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ResultQuestion } from '@/lib/pollResultTypes'
import type { ResponsesPage } from '@/lib/responseTypes'
import { RESPONSES_PAGE_SIZE } from '@/lib/responseTypes'
import { formatThaiDateTime } from '@/lib/thaiDate'

// คำตอบรายชุด แบ่งหน้าที่ server ใหม่สุดก่อน
// ฝั่งเจ้าของโพลไม่มีรหัสผู้ตอบ (anonymous) ยกเว้นโพลที่เปิด "ระบุคนส่ง" · ขอ withIdentity แล้ว API ตัดสินเองว่าจะส่งให้ไหม
export function ResponseList({ pollId, questions, withIdentity }: {
    pollId: string
    questions: Pick<ResultQuestion, 'position' | 'order' | 'title'>[]
    withIdentity: boolean
}) {
    const [page, setPage] = useState(1)
    const [data, setData] = useState<ResponsesPage | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const query = new URLSearchParams({ page: String(page) })
        if (withIdentity) query.set('withIdentity', '1')
        fetch(`/api/polls/${pollId}/responses?${query}`, { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error()
                setData(await res.json())
                setError(null)
            })
            .catch(() => {
                if (!controller.signal.aborted) setError('โหลดคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง')
            })
        // เปลี่ยนหน้าเร็วๆ ยกเลิกคำขอเก่า ไม่ให้ผลหน้าเก่ามาทับหน้าใหม่
        return () => controller.abort()
    }, [pollId, page, withIdentity])

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

    const pages = Math.max(1, Math.ceil(data.total / RESPONSES_PAGE_SIZE))
    return (
        <div className='flex flex-col gap-3'>
            <ul className='flex flex-col gap-3'>
                {data.rows.map((row) => (
                    <li key={row.no} className='flex flex-col gap-2 rounded-2xl border bg-card p-4'>
                        <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                            <span className='font-heading text-lg font-bold'>#{row.no}</span>
                            <time dateTime={row.submittedAt} className='text-sm text-ink-500'>{formatThaiDateTime(row.submittedAt)}</time>
                        </div>
                        {data.identityVisible && (
                            <p className='text-sm'><span className='text-ink-500'>ผู้ตอบ: </span>{row.respondent ?? 'ไม่ระบุ'}</p>
                        )}
                        <dl className='flex flex-col gap-1.5'>
                            {questions.map((q) => (
                                <div key={q.position}>
                                    <dt className='text-sm text-ink-500 break-words'>ข้อ {q.order} {q.title}</dt>
                                    <dd className='pl-2 break-words whitespace-pre-line'>
                                        {row.answers[q.position]?.join(', ') || <span className='text-ink-400'>ไม่ได้ตอบ</span>}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </li>
                ))}
            </ul>
            <nav aria-label='เปลี่ยนหน้าคำตอบ' className='flex items-center justify-between gap-2'>
                <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft />
                    ก่อนหน้า
                </Button>
                <span className='text-sm text-ink-500 tabular-nums'>หน้า {page} จาก {pages} · {data.total.toLocaleString('th-TH')} ชุด</span>
                <Button variant='outline' size='sm' disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                    ถัดไป
                    <ChevronRight />
                </Button>
            </nav>
        </div>
    )
}
