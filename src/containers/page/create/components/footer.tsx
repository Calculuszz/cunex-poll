'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send, Eye, Download, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import type { CreateStep } from '@/store/createStepStore'
import { useCreatePollStore } from '@/store/createPollStore'
import { useElementStore } from '@/store/elementStore'
import { SubmitDialog } from './submitDialog'
import { buildPollPayload } from './buildPayload'
import { saveDraft } from './saveDraft'

// ถ้ากำลังแก้ฉบับร่าง (draftId ไม่เป็น null) การส่งขออนุมัติจะเขียนทับฉบับร่างเดิม ไม่สร้างโพลซ้ำ
export function CreateFooter({ step, onStepChange, draftId }: {
    step: CreateStep
    onStepChange: (next: CreateStep) => void
    draftId: string | null
}) {
    const router = useRouter()
    const [submitOpen, setSubmitOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [draftSaving, setDraftSaving] = useState(false)
    const [draftError, setDraftError] = useState<string | null>(null)

    const handleSubmit = async () => {
        const built = buildPollPayload(useCreatePollStore.getState(), useElementStore.getState().items)
        if (!built.ok) {
            setError(built.error)
            return
        }

        setPending(true)
        setError(null)
        try {
            const res = await fetch(draftId ? `/api/polls/${draftId}` : '/api/polls', {
                method: draftId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(built.payload),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'ส่งโพลไม่สำเร็จ ลองใหม่อีกครั้ง')
                return
            }
            // ส่งสำเร็จแล้วร่างเดิมไม่มีประโยชน์ จึงล้างทั้งข้อมูลโพลและคำถาม
            useCreatePollStore.getState().reset()
            useElementStore.getState().removeAll()
            setSubmitOpen(false)
            router.push('/')
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่')
        } finally {
            setPending(false)
        }
    }

    const handleSaveDraft = async () => {
        setDraftSaving(true)
        setDraftError(null)
        const result = await saveDraft(draftId)
        if (!result.ok) {
            setDraftSaving(false)
            setDraftError(result.error)
            return
        }
        router.push('/')
    }

    return (
        <div className='flex flex-col gap-2 py-4 pb-8 items-start relative'>
            <div className=' absolute top-0 -left-4 w-screen h-full bg-ink-400/5 -z-1'/>
            <button
                type='button'
                onClick={handleSaveDraft}
                disabled={draftSaving}
                aria-busy={draftSaving}
                className='text-ink-500 font-heading font-bold flex gap-1 items-center cursor-pointer underline disabled:opacity-50'
            >
                {draftSaving ? <Loader2 className='size-4 animate-spin'/> : <Download className='size-4'/>}
                <span>บันทึกฉบับร่าง</span>
            </button>
            {draftError && <p role='alert' className='text-base text-destructive'>{draftError}</p>}
            {step === 1 ? (
                <Button type='button' className={`w-full`} onClick={() => onStepChange(2)}>
                    <span className='font-heading text-lg font-bold'>ถัดไป</span>
                    <ArrowRight/>
                </Button>
            ) : (
                <div className='flex gap-1 w-full'>
                    <Button type='button' variant='outline' className={`px-4`} onClick={() => onStepChange(1)}>
                        <ArrowLeft/>
                        <span className='font-heading text-lg font-bold'>ย้อนกลับ</span>
                    </Button>
                    <Button type='button' className={`grow`} onClick={() => { setError(null); setSubmitOpen(true) }}>
                        <Send/>
                        <span className='font-heading text-lg font-bold'>ส่งขออนุมัติ</span>
                    </Button>
                    <Button aria-label='ดูตัวอย่าง' className={" aspect-square bg-yellow-500 "}><Eye/></Button>
                    {/* ยังไม่มีหน้า preview จึงปุ่มดูตัวอย่างแค่ปิด dialog */}
                    <SubmitDialog
                        open={submitOpen}
                        onOpenChange={setSubmitOpen}
                        onPreview={() => setSubmitOpen(false)}
                        onSubmit={handleSubmit}
                        pending={pending}
                        error={error}
                    />
                </div>
            )}
        </div>
    )
}
