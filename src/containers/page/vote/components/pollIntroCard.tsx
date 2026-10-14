'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, List, Loader2, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { estimateMinutes, type IneligibleReason, type MyResponse, type VoterPoll } from '@/lib/voteForm'
import { formatThaiDateTime, formatTimeLeftShort } from '@/lib/thaiDate'
import { cn } from '@/lib/utils'

const pill = 'h-11 w-full rounded-full font-heading text-base font-bold'
const outlinePill = cn(buttonVariants({ variant: 'outline' }), pill, 'border-primary text-primary')

// วันที่แบบตัวเลข พ.ศ. "15/10/2569 (14:30)"
const savedDate = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' })
const savedTime = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className='text-sm text-ink-500'>{label}</dt>
            <dd className='pl-2'>{children}</dd>
        </div>
    )
}

// การ์ดหน้าแรกของโพล ปุ่มด้านล่างเปลี่ยนตามสถานะคำตอบของผู้ใช้และสถานะโพล
export function PollIntroCard({ poll, me, reason, resumePage, canSeeResults }: {
    poll: VoterPoll
    me: MyResponse
    reason: IneligibleReason | null
    resumePage: number
    canSeeResults: boolean
}) {
    const router = useRouter()
    const [expanded, setExpanded] = useState(false)
    const [starting, setStarting] = useState(false)

    // เริ่มโหวต = สร้างฉบับร่างว่างก่อน หน้าคำถามจะได้เข้าได้ (เข้าตรงโดยไม่มีร่างจะถูกส่งกลับหน้านี้)
    const start = async () => {
        setStarting(true)
        try {
            const res = await fetch(`/api/polls/${poll.id}/my-response`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: {} }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                toast.error(data?.error ?? 'เริ่มโหวตไม่สำเร็จ')
                router.refresh()
                return
            }
            router.push(`/${poll.id}/q/1`)
        } catch {
            toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setStarting(false)
        }
    }

    const closed = reason === 'CLOSED'
    const notOpen = reason === 'NOT_OPEN'
    const voted = me.submittedAt !== null

    let actions: React.ReactNode
    if (notOpen) {
        actions = <Button disabled className={pill}>โพลนี้ยังไม่เปิดให้ตอบ</Button>
    } else if (closed) {
        actions = (
            <>
                <Button disabled className={pill}>ปิดโหวตแล้ว</Button>
                {canSeeResults && <Link href={`/${poll.id}/results`} className={outlinePill}>ดูผลโหวต</Link>}
            </>
        )
    } else if (me.status === 'draft') {
        actions = <Link href={`/${poll.id}/q/${resumePage}`} className={cn(buttonVariants(), pill)}>โหวตต่อ</Link>
    } else if (voted) {
        actions = (
            <>
                {reason === 'ALREADY_VOTED'
                    ? <Button disabled className={pill}>โหวตแล้ว</Button>
                    : (
                        // โพลที่ตอบซ้ำได้ ส่งแล้วยังเริ่มรอบใหม่ได้ (นับทุกครั้งที่ส่ง)
                        <Button className={pill} disabled={starting} aria-busy={starting} onClick={start}>
                            {starting && <Loader2 className='animate-spin' />}
                            โหวตอีกครั้ง
                        </Button>
                    )}
                <div className='grid grid-cols-2 gap-2'>
                    <Link href='/explore' className={outlinePill}>ไปที่หน้าโพลที่ตอบได้</Link>
                    <Link href={`/${poll.id}/my-answers`} className={outlinePill}>ดูคำตอบของคุณ</Link>
                </div>
                {canSeeResults && <Link href={`/${poll.id}/results`} className={outlinePill}>ดูผลโหวต</Link>}
            </>
        )
    } else {
        actions = (
            <Button className={pill} disabled={starting} aria-busy={starting} onClick={start}>
                {starting && <Loader2 className='animate-spin' />}
                เริ่มโหวต
            </Button>
        )
    }

    return (
        <article className='flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm'>
            <div className='flex flex-col gap-1'>
                <h1 className='font-heading text-3xl font-bold break-words'>{poll.title}</h1>
                {me.status === 'draft' && me.lastSavedAt && (
                    <p className='flex items-center gap-1 text-sm text-ink-500 italic'>
                        <CheckCircle2 className='size-4 shrink-0' />
                        บันทึกคำตอบล่าสุด: {savedDate.format(new Date(me.lastSavedAt))} ({savedTime.format(new Date(me.lastSavedAt))})
                    </p>
                )}
            </div>

            <dl className='flex flex-col gap-2'>
                <MetaRow label='ขอบเขตผู้ตอบ'>{poll.audienceLabel}</MetaRow>
                <MetaRow label='เวลาปิดโหวต'>{formatThaiDateTime(poll.closeAt)} ({formatTimeLeftShort(poll.closeAt)})</MetaRow>
                {poll.description && (
                    <MetaRow label='รายละเอียด'>
                        <button
                            type='button'
                            aria-expanded={expanded}
                            onClick={() => setExpanded((v) => !v)}
                            className={cn('rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', !expanded && 'line-clamp-2')}
                        >
                            {poll.description}
                        </button>
                    </MetaRow>
                )}
            </dl>

            <div className='grid grid-cols-2 border-y py-3'>
                <div className='flex flex-col items-center gap-0.5 border-r'>
                    <span className='text-sm text-ink-500'>จำนวนคำถาม</span>
                    <span className='flex items-center gap-1 font-bold'><List className='size-4' />{poll.questionCount} คำถาม</span>
                </div>
                <div className='flex flex-col items-center gap-0.5'>
                    <span className='text-sm text-ink-500'>ระยะเวลาที่ใช้</span>
                    <span className='flex items-center gap-1 font-bold'><Timer className='size-4' />~{estimateMinutes(poll.questionCount)} นาที</span>
                </div>
            </div>

            <div className='flex flex-col gap-2'>{actions}</div>
        </article>
    )
}
