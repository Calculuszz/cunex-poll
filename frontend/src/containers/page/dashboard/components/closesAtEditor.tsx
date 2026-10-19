'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DateTimePicker } from '@/components/common/dateTimePicker'

// เลื่อนเวลาปิดโหวต (PATCH /closes-at) ได้ตอนรออนุมัติ อนุมัติแล้ว และกำลังโหวต · ต้องเป็นเวลาในอนาคต
// จำเป็นเมื่อโพลที่อนุมัติแล้วเลยเวลาปิดก่อนได้กด Publish (backend ไม่ให้เปิดจนกว่าจะเลื่อนเวลา)
export function ClosesAtEditor({ pollId, closesAt }: { pollId: string; closesAt: string | null }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState<Date | undefined>(closesAt ? new Date(closesAt) : undefined)
    const [pending, setPending] = useState(false)

    const save = async () => {
        if (!value) return
        setPending(true)
        try {
            await api.polls.setClosesAt(pollId, value.toISOString())
            setOpen(false)
            toast.success('เปลี่ยนเวลาปิดแล้ว')
            router.refresh()
        } catch (err) {
            toast.error(errorMessage(err, 'เปลี่ยนเวลาปิดไม่สำเร็จ'))
        } finally {
            setPending(false)
        }
    }

    return (
        <>
            <button
                type='button'
                onClick={() => setOpen(true)}
                className='flex items-center gap-1 self-start rounded-sm text-sm font-bold text-primary underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
            >
                <CalendarClock className='size-4' />
                เปลี่ยนเวลาปิด
            </button>
            <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next) }}>
                <DialogContent>
                    <div className='flex w-full flex-col items-center gap-4 pt-4'>
                        <CalendarClock className='size-14 text-primary' />
                        <DialogTitle className='font-heading text-xl font-bold'>เปลี่ยนเวลาปิดโหวต</DialogTitle>
                        <DialogDescription className='text-center text-base'>ระบบจะปิดรับคำตอบอัตโนมัติเมื่อถึงเวลานี้</DialogDescription>
                        <div className='w-full'><DateTimePicker value={value} onChange={setValue} /></div>
                        <div className='flex w-full gap-2 pb-2'>
                            <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => setOpen(false)}>ยกเลิก</Button>
                            <Button className='flex-1' disabled={pending || !value} aria-busy={pending} onClick={save}>
                                {pending && <Loader2 className='animate-spin' />}
                                <span className='font-heading text-base font-bold'>บันทึก</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
