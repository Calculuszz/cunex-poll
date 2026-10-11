'use client'
import React, { useEffect, useRef } from 'react'
import { PollType, PollDetail, PollTypeMore, CreateFooter, CreateStepper } from '@/containers/page/create/components'
import { cn } from '@/lib/utils'
import { useCreateStepStore, type CreateStep } from '@/store/createStepStore'
import { ElementContainer } from "./elementContainer"

export function CreateContainer() {
    const step = useCreateStepStore((s) => s.step)
    const setStep = useCreateStepStore((s) => s.setStep)
    const stepperRef = useRef<HTMLParagraphElement>(null)
    useEffect(() => () => setStep(1), [setStep])

    const goTo = (next: CreateStep) => {
        setStep(next)
        window.scrollTo({ top: 0 })
        stepperRef.current?.focus({ preventScroll: true })
    }

    return (
        <div className=' flex flex-col gap-2 justify-between'>
            <CreateStepper step={step} ref={stepperRef} />
            <div className={cn('flex flex-col gap-2', step !== 1 && 'hidden')}>
                <PollType />
                <PollDetail />
                <PollTypeMore />
            </div>
            <div className={cn(step !== 2 ? 'hidden': 'min-h-[70vh]')}>
                <ElementContainer />
            </div>
            <CreateFooter step={step} onStepChange={goTo} />
        </div>
    )
}
