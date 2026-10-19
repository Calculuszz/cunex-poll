import React from 'react'
import { cn } from '@/lib/utils'
import type { CreateStep } from '@/store/createStepStore'

const STEP_TITLE: Record<CreateStep, string> = {
    1: 'ข้อมูลโพล',
    2: 'คำถามและองค์ประกอบ',
}

export function CreateStepper({ step, ref }: { step: CreateStep; ref?: React.Ref<HTMLParagraphElement> }) {
    return (
        <div className='flex flex-col gap-1'>
            <p ref={ref} tabIndex={-1} className='text-sm text-ink-500 outline-none'>
                ขั้นที่ {step} จาก 2 · {STEP_TITLE[step]}
            </p>
            <div className='flex gap-1' aria-hidden>
                <span className='h-1 grow rounded-full bg-primary' />
                <span className={cn('h-1 grow rounded-full', step === 2 ? 'bg-primary' : 'bg-badge')} />
            </div>
        </div>
    )
}
