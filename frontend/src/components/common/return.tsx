"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useCreateStepStore } from '@/store/createStepStore'
import { useLeaveGuardStore } from '@/store/leaveGuardStore'

export function ReturnButton() {
    const pathName = usePathname();
    const router = useRouter();
    const step = useCreateStepStore((s) => s.step)
    const setStep = useCreateStepStore((s) => s.setStep)
    const requestLeave = useLeaveGuardStore((s) => s.request)
    // หน้าสร้างโพลมีทั้ง /create และ /create/[id] (แก้ไขฉบับร่าง) ต้องดักปุ่มย้อนกลับเหมือนกัน
    const isCreatePage = pathName === "/create" || pathName.startsWith("/create/")
    if (isCreatePage && step === 2) {
        return (
            <button
                type='button'
                aria-label='กลับไปขั้นที่ 1'
                className='flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                onClick={() => {
                    setStep(1)
                    window.scrollTo({ top: 0 })
                }}
            >
                <ChevronLeft className='size-7 text-primary'/>
            </button>
        )
    }
    if (isCreatePage) {
        return (
            <button
                type='button'
                aria-label='ย้อนกลับ'
                className='flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                onClick={() => requestLeave("back")}
            >
                <ChevronLeft className='size-7 text-primary'/>
            </button>
        )
    }
    return (
        <button
            type='button'
            aria-label='ย้อนกลับ'
            onClick={() => router.back()}
            className={`rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${pathName !== "/" ? "flex" : "hidden"}`}
        >
            <ChevronLeft className='size-7 text-primary'/>
        </button>
    )
}
