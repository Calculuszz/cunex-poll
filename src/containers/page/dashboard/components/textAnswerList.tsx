'use client'
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api, errorMessage } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatThaiDateTime } from '@/lib/thaiDate'

const PREVIEW_LIMIT = 3
const PAGE_SIZE = 20

type TextItem = { text: string; createdAt?: string }

// createdAt [เสนอเพิ่ม] โชว์เมื่อ backend ส่งมา
function AnswerBubble({ item }: { item: TextItem }) {
    return (
        <li className='flex flex-col gap-1 rounded-xl bg-inner-bg px-3 py-2'>
            <p className='break-words whitespace-pre-line'>{item.text}</p>
            {item.createdAt && <time dateTime={item.createdAt} className='text-xs text-ink-500'>{formatThaiDateTime(item.createdAt)}</time>}
        </li>
    )
}

// คำตอบแบบข้อความของคำถามหนึ่งข้อ (GET /results/text) การ์ดโชว์ล่าสุดไม่กี่รายการ ที่เหลือดูใน dialog แบบโหลดเพิ่ม
export function TextAnswerList({ pollId, elementId, title, total }: {
    pollId: string
    elementId: string
    title: string
    total: number
}) {
    const [preview, setPreview] = useState<TextItem[] | null>(null)
    const [open, setOpen] = useState(false)
    const [all, setAll] = useState<TextItem[]>([])
    const [cursor, setCursor] = useState<string | null | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (total === 0) return
        let alive = true
        api.polls.textAnswers(pollId, elementId, null, PREVIEW_LIMIT)
            .then((page) => { if (alive) setPreview(page.items) })
            .catch(() => { if (alive) setPreview([]) })
        return () => { alive = false }
    }, [pollId, elementId, total])

    if (total === 0) return <p className='text-ink-500'>ยังไม่มีผู้ตอบ</p>

    const loadMore = async () => {
        setLoading(true)
        setError(null)
        try {
            const page = await api.polls.textAnswers(pollId, elementId, cursor ?? null, PAGE_SIZE)
            setAll((prev) => [...prev, ...page.items])
            setCursor(page.nextCursor)
        } catch (err) {
            setError(errorMessage(err, 'โหลดคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง'))
        } finally {
            setLoading(false)
        }
    }

    const openAll = () => {
        setOpen(true)
        if (cursor === undefined) void loadMore()
    }

    return (
        <div className='flex flex-col gap-2'>
            {preview === null
                ? <Loader2 className='animate-spin text-ink-500' aria-label='กำลังโหลด' />
                : <ul className='flex flex-col gap-2'>{preview.map((t, i) => <AnswerBubble key={i} item={t} />)}</ul>}
            {total > PREVIEW_LIMIT && (
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
                    <div className='-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1'>
                        <ul className='flex flex-col gap-2'>{all.map((t, i) => <AnswerBubble key={i} item={t} />)}</ul>
                        {error && <p role='alert' className='text-destructive'>{error}</p>}
                        {loading && <Loader2 className='mx-auto animate-spin text-ink-500' aria-label='กำลังโหลด' />}
                        {!loading && cursor && (
                            <Button variant='outline' className='self-center rounded-full font-heading text-base font-bold' onClick={loadMore}>
                                โหลดเพิ่ม
                            </Button>
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
