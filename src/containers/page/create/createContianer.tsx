'use client'
import React, { useEffect, useRef, useState } from 'react'
import { PollType, PollDetail, PollTypeMore, CreateFooter, CreateStepper } from '@/containers/page/create/components'
import { cn } from '@/lib/utils'
import { useCreateStepStore, type CreateStep } from '@/store/createStepStore'
import { useCreatePollStore } from '@/store/createPollStore'
import { useElementStore } from '@/store/elementStore'
import { useCreateDraftStore } from '@/store/createDraftStore'
import type { DraftInitial } from '@/containers/page/create/draftInitial'
import { ElementContainer } from "./elementContainer"

// draft มีค่าเมื่อเป็นหน้าแก้ไขฉบับร่าง หน้าที่ใช้จะ key ด้วย id ของฉบับร่าง จึงเติมค่าแค่ตอน mount ครั้งเดียวพอ
export function CreateContainer({ draft }: { draft?: DraftInitial }) {
    const step = useCreateStepStore((s) => s.step)
    const setStep = useCreateStepStore((s) => s.setStep)
    const stepperRef = useRef<HTMLParagraphElement>(null)
    useEffect(() => () => setStep(1), [setStep])

    // เติมค่าฉบับร่างลงฟอร์มก่อนลูกเรนเดอร์ครั้งแรก เพื่อไม่ให้เห็นค่าเก่าที่ค้างในเครื่องวูบหนึ่ง
    useState(() => {
        if (draft) {
            useCreatePollStore.getState().update(draft.form)
            useElementStore.setState({ items: draft.items })
        }
        return true
    })

    useEffect(() => {
        useCreateDraftStore.getState().setDraftId(draft?.id ?? null)
        return () => useCreateDraftStore.getState().setDraftId(null)
    }, [draft])

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
            <CreateFooter step={step} onStepChange={goTo} draftId={draft?.id ?? null} />
        </div>
    )
}
