'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Send, Eye, Download, ArrowLeft, ArrowRight } from 'lucide-react'
import type { CreateStep } from '@/store/createStepStore'

export function CreateFooter({ step, onStepChange }: { step: CreateStep; onStepChange: (next: CreateStep) => void }) {
    return (
        <div className='flex flex-col gap-2 py-4 pb-8 items-start relative'>
            <div className=' absolute top-0 -left-4 w-screen h-full bg-ink-400/5 -z-1'/>
            <div className='text-ink-500 font-heading font-bold flex gap-1 items-center cursor-pointer underline'>
                <Download className='size-4'/>
                <span>บันทึกฉบับร่าง</span>
            </div>
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
                    <Button className={`grow`}>
                        <Send/>
                        <span className='font-heading text-lg font-bold'>ส่งขออนุมัติ</span>
                    </Button>
                    <Button aria-label='ดูตัวอย่าง' className={" aspect-square bg-yellow-500 "}><Eye/></Button>
                </div>
            )}
        </div>
    )
}
