'use client'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PollType, PollDetail, PollTypeMore, CreateFooter, CreateStepper } from '@/containers/page/create/components'
import { MessageSquareWarning } from 'lucide-react'
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
    // เริ่มที่ขั้นที่ 1 เสมอ ยกเว้นกลับมาจากหน้าดูตัวอย่างที่ขอให้กลับขั้นคำถาม
    // ตั้งตอน mount แทนการ reset ตอน unmount เพราะ dev strict mode เรียก cleanup ทันทีหลัง mount ทำให้ค่าที่ขอไว้หาย
    // อ่านขั้นที่จะเริ่มตอน render แต่เขียนลง store ใน layout effect: ปุ่มย้อนกลับบน navbar subscribe store นี้อยู่
    // ถ้า setStep ระหว่าง render React จะเตือนว่าอัปเดต component อื่นกลาง render · layout effect รันก่อน paint จึงไม่เห็นขั้นผิดวูบ
    // strict mode รัน effect สองรอบ แต่ initialStep ถูกจับไว้แล้ว รอบสองจึงยังได้ขั้นเดิม
    const [initialStep] = useState<CreateStep>(() => useCreateStepStore.getState().resumeStep ?? 1)
    useLayoutEffect(() => {
        const steps = useCreateStepStore.getState()
        steps.setStep(initialStep)
        steps.setResumeStep(null)
    }, [initialStep])

    // เติมค่าฉบับร่างลงฟอร์มก่อนลูกเรนเดอร์ครั้งแรก เพื่อไม่ให้เห็นค่าเก่าที่ค้างในเครื่องวูบหนึ่ง
    // ฉบับร่างเดิมที่โหลดไปแล้ว (เช่นกลับมาจากหน้าดูตัวอย่าง) ไม่โหลดซ้ำ ของที่แก้ค้างไว้จะได้ไม่หาย
    useState(() => {
        const drafts = useCreateDraftStore.getState()
        if (draft && drafts.hydratedId !== draft.id) {
            useCreatePollStore.getState().update(draft.form)
            useElementStore.setState({ items: draft.items })
        }
        drafts.setHydratedId(draft?.id ?? null)
        return true
    })

    useEffect(() => {
        useCreateDraftStore.getState().setDraft(draft?.id ?? null, draft?.version ?? null)
        return () => useCreateDraftStore.getState().setDraft(null, null)
    }, [draft])

    const goTo = (next: CreateStep) => {
        setStep(next)
        window.scrollTo({ top: 0 })
        stepperRef.current?.focus({ preventScroll: true })
    }

    return (
        <div className=' flex flex-col gap-2 justify-between'>
            <CreateStepper step={step} ref={stepperRef} />
            {/* โพลที่ถูกปฏิเสธกลับมาแก้แล้วส่งใหม่ได้ โชว์ความเห็นของแอดมินไว้ให้แก้ตาม */}
            {draft?.rejection && (
                <div role='status' className='flex gap-2 rounded-xl bg-red-100 px-3 py-2 text-red-200'>
                    <MessageSquareWarning className='mt-0.5 size-5 shrink-0' />
                    <div className='flex flex-col'>
                        <span className='font-bold'>ผู้ดูแลระบบไม่อนุมัติโพลนี้</span>
                        <span className='break-words'>{draft.rejection}</span>
                        <span className='text-sm'>แก้ตามความเห็นแล้วกดส่งขออนุมัติอีกครั้งได้</span>
                    </div>
                </div>
            )}
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
