'use client'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { TextAnswer } from '@/lib/pollResultTypes'
import { formatThaiDateTime } from '@/lib/thaiDate'

function AnswerBubble({ answer }: { answer: TextAnswer }) {
    return (
        <li className='flex flex-col gap-1 rounded-xl bg-inner-bg px-3 py-2'>
            <p className='break-words whitespace-pre-line'>{answer.text}</p>
            <time dateTime={answer.createdAt} className='text-xs text-ink-500'>{formatThaiDateTime(answer.createdAt)}</time>
        </li>
    )
}

// คำตอบแบบข้อความ แสดงล่าสุดไม่กี่รายการ ถ้ามีมากกว่านั้นเปิดดูทั้งหมดใน dialog (ดึงตอนกดครั้งแรก)
export function TextAnswerList({ pollId, position, title, answers, total }: {
    pollId: string
    position: number
    title: string
    answers: TextAnswer[]
    total: number
}) {
    const [open, setOpen] = useState(false)
    const [all, setAll] = useState<TextAnswer[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    if (total === 0) return <p className='text-ink-500'>ยังไม่มีผู้ตอบ</p>

    const openAll = async () => {
        setOpen(true)
        if (all) return
        setError(null)
        try {
            const res = await fetch(`/api/polls/${pollId}/answers/${position}`)
            if (!res.ok) throw new Error()
            setAll(await res.json())
        } catch {
            setError('โหลดคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง')
        }
    }

    return (
        <div className='flex flex-col gap-2'>
            <ul className='flex flex-col gap-2'>
                {answers.map((a) => <AnswerBubble key={a.id} answer={a} />)}
            </ul>
            {total > answers.length && (
                <button
                    type='button'
                    onClick={openAll}
                    className='self-start rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                    ดูทั้งหมด ({total.toLocaleString('th-TH')})
                </button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='flex max-h-[85vh] flex-col'>
                    <DialogTitle className='font-heading text-xl font-bold'>คำตอบทั้งหมด</DialogTitle>
                    <DialogDescription className='text-base'>{title}</DialogDescription>
                    <div className='-mx-1 min-h-0 flex-1 overflow-y-auto px-1'>
                        {error && <p role='alert' className='text-destructive'>{error}</p>}
                        {!error && !all && <Loader2 className='mx-auto my-6 animate-spin text-ink-500' aria-label='กำลังโหลด' />}
                        {all && (
                            <ul className='flex flex-col gap-2'>
                                {all.map((a) => <AnswerBubble key={a.id} answer={a} />)}
                            </ul>
                        )}
                    </div>
                    <Button variant='outline' className='self-end rounded-full border-ink-400 px-5 font-heading text-base font-bold text-ink-700' onClick={() => setOpen(false)}>
                        ปิด
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
