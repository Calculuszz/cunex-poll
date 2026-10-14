import React from 'react'
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// แถบปุ่มติดล่างจอ: หน้าแรกมีแค่ถัดไป · หน้ากลางมีย้อนกลับ+ถัดไป · หน้าสุดท้ายมีย้อนกลับ+ส่งคำตอบ
export function StepActionBar({ isFirst, isLast, canNext, busy, onBack, onNext, onSubmit }: {
    isFirst: boolean
    isLast: boolean
    canNext: boolean
    busy: boolean
    onBack: () => void
    onNext: () => void
    onSubmit: () => void
}) {
    const pill = 'h-11 rounded-full font-heading text-base font-bold'
    return (
        <div className='sticky bottom-0 z-20 -mx-4 mt-8 flex gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
            {!isFirst && (
                <Button variant='outline' className={cn(pill, 'border-primary text-primary', isLast ? 'px-5' : 'flex-1')} disabled={busy} onClick={onBack}>
                    <ArrowLeft />
                    ย้อนกลับ
                </Button>
            )}
            {isLast ? (
                <Button className={cn(pill, 'flex-1')} disabled={busy} aria-busy={busy} onClick={onSubmit}>
                    {busy ? <Loader2 className='animate-spin' /> : <Send />}
                    ส่งคำตอบ
                </Button>
            ) : (
                <Button className={cn(pill, isFirst ? 'ml-auto px-8' : 'flex-1')} disabled={!canNext || busy} aria-busy={busy} onClick={onNext}>
                    ถัดไป
                    {busy ? <Loader2 className='animate-spin' /> : <ArrowRight />}
                </Button>
            )}
        </div>
    )
}
