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

    // ออกจากหน้าแล้วกลับเข้ามาใหม่ต้องเริ่มที่ step แรกเสมอ เพราะข้อมูลโพลยังไม่ได้เก็บข้ามหน้า
    useEffect(() => () => setStep(1), [setStep])

    const goTo = (next: CreateStep) => {
        setStep(next)
        // step ใหม่สูงไม่เท่าเดิม ถ้าไม่เลื่อนกลับขึ้นบน ผู้ใช้จะค้างอยู่กลางหน้าหรือท้ายหน้าของ step ใหม่
        window.scrollTo({ top: 0 })
        stepperRef.current?.focus({ preventScroll: true })
    }

    return (
        <div className=' flex flex-col gap-2'>
            <CreateStepper step={step} ref={stepperRef} />
            {/* ซ่อนแทนการ unmount เพราะข้อมูลโพลยังเป็น state ในหน้า ถ้า unmount ค่าที่กรอกไว้จะหายตอนสลับ step */}
            <div className={cn('flex flex-col gap-2', step !== 1 && 'hidden')}>
                <PollType />
                <PollDetail />
                <PollTypeMore />
            </div>
            <div className={cn(step !== 2 && 'hidden')}>
                <ElementContainer />
            </div>
            <CreateFooter step={step} onStepChange={goTo} />
        </div>
    )
}
