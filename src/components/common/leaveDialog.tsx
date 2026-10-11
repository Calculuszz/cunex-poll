"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { useElementStore } from '@/store/elementStore'
import { useCreatePollStore } from '@/store/createPollStore'
import { useLeaveGuardStore } from '@/store/leaveGuardStore'

// dialog เตือนก่อนออกจากหน้า create ใช้ร่วมกันทั้งปุ่มย้อนกลับและเมนู profile
export function LeaveDialog() {
    const router = useRouter()
    const target = useLeaveGuardStore((s) => s.target)
    const close = useLeaveGuardStore((s) => s.close)
    const removeAll = useElementStore((s) => s.removeAll)
    const resetPoll = useCreatePollStore((s) => s.reset)

    const leave = (t: string) => {
        if (t === "back") router.back()
        else router.push(t)
    }

    return (
        <Dialog open={target !== null} onOpenChange={(open) => { if (!open) close() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='font-heading font-bold text-xl'>ออกจากหน้าสร้างโพล?</DialogTitle>
                    <DialogDescription className='text-base'>
                        ข้อมูลที่ยังไม่ได้บันทึกจะหายไป ถ้าต้องการเก็บไว้ทำต่อภายหลังให้กดบันทึก draft ก่อนออก
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='bg-transparent items-center'>
                    <Button variant='ghost' className='mr-auto px-4 py-5' onClick={close}>
                        <span className='font-heading font-bold text-base'>ทำต่อ</span>
                    </Button>
                    <Button
                        variant='outline'
                        className='px-4 py-5'
                        onClick={() => {
                            // ข้อมูลโพลและคำถามถูกเก็บใน localStorage อยู่แล้ว การออกโดยไม่ล้างค่าจึงเท่ากับบันทึก draft
                            const t = target
                            close()
                            if (t) leave(t)
                        }}
                    >
                        <span className='font-heading font-bold text-base'>บันทึก draft</span>
                    </Button>
                    <Button
                        variant='destructive'
                        className='px-4 py-5'
                        onClick={() => {
                            const t = target
                            close()
                            removeAll()
                            resetPoll()
                            if (t) leave(t)
                        }}
                    >
                        <span className='font-heading font-bold text-base'>ยืนยัน</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
