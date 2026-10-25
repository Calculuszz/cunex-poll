"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2, Save } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { useLeaveGuardStore } from '@/store/leaveGuardStore'
import { resetCreateForm, saveDraft } from '@/containers/page/create/draftActions'
import { SearchAlert } from "lucide-react"

// dialog เตือนก่อนออกจากหน้า create ใช้ร่วมกันทั้งปุ่มย้อนกลับและเมนู profile
// หน้าตาเดียวกับ dialog ยืนยันการส่งขออนุมัติ
export function LeaveDialog() {
    const router = useRouter()
    const target = useLeaveGuardStore((s) => s.target)
    const close = useLeaveGuardStore((s) => s.close)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const leave = (t: string) => router.push(t)

    const handleOpenChange = (open: boolean) => {
        if (open || saving) return
        setError(null)
        close()
    }

    const handleSaveDraft = async () => {
        setSaving(true)
        setError(null)
        const result = await saveDraft()
        setSaving(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        resetCreateForm()
        const t = target
        close()
        if (t) leave(t)
    }

    return (
        <Dialog open={target !== null} onOpenChange={handleOpenChange}>
            <DialogContent>
                <div className='flex justify-center pt-4 flex-col items-center w-full'>
                    <SearchAlert className='text-primary size-14' />
                    <DialogTitle className='font-heading text-xl py-6 font-bold'>ออกจากหน้าสร้างโพล ?</DialogTitle>
                    <div className='text-center text-base flex flex-col items-center text-ink-500'>
                        <span>ข้อมูลที่ยังไม่ได้บันทึกจะหายไป<br />ถ้าต้องการเก็บไว้ทำต่อภายหลังให้กดบันทึกฉบับร่างก่อนออก</span>
                        <div onClick={handleSaveDraft} className='flex text-black font-heading underline cursor-pointer py-2'>
                            {saving ? <Loader2 className='animate-spin' /> : <Save />}
                            บันทึกฉบับร่าง
                        </div>
                    </div>
                    <div className='flex w-full gap-2 py-4'>
                        <Button variant='outline' className='flex-1 font-heading font-bold text-base' disabled={saving} onClick={() => handleOpenChange(false)}>
                            ทำต่อ
                        </Button>
                        <Button
                            variant='destructive'
                            className='flex-1 font-heading font-bold text-base'
                            disabled={saving}
                            onClick={() => {
                                const t = target
                                close()
                                // ทิ้งของที่แก้แล้ว ครั้งหน้าที่เปิดฉบับร่างนี้ต้องโหลดจาก server ใหม่
                                resetCreateForm()
                                if (t) leave(t)
                            }}
                        >
                            ยืนยัน
                        </Button>
                    </div>
                </div>
                {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
            </DialogContent>
        </Dialog>
    )
}
