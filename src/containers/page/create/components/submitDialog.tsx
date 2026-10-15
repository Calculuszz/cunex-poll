'use client'
import React from 'react'
import { Eye, Loader2, Send } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function SubmitDialog({ open, onOpenChange, onPreview, onSubmit, pending, error }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPreview: () => void
    onSubmit: () => void
    pending: boolean
    error: string | null
}) {
    return (
        <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
            <DialogContent>
                <div className='flex justify-center pt-4 flex-col items-center w-full'>
                    <Send className='text-primary size-14' />
                    <span className=' font-heading text-xl py-6 font-bold'>ยืนยันการส่งขออนุมัติ ?</span>
                    <div className=' flex flex-col items-center'>
                        <span className=' text-center max-w-full text-base'>
                            แบบฟอร์มนี้จะถูกส่งให้ผู้ดูแลระบบตรวจสอบ<br/>และอนุมัติก่อนนำไปใช้งาน หลังจากส่งแล้วแบบฟอร์ม<br/>จะอยู่ในสถานะ “รออนุมัติ”
                        </span>
                        <button type='button' onClick={onPreview} className=' text-lg underline cursor-pointer font-bold'>ดูตัวอย่าง</button>
                    </div>
                    <div className='flex w-full gap-2 py-4'>
                        <Button variant={'outline'} className="flex-1 font-heading font-bold text-base" disabled={pending} onClick={() => onOpenChange(false)}>แก้ไขต่อ</Button>
                        <Button className='flex-1' onClick={onSubmit} disabled={pending} aria-busy={pending}>
                            {pending ? <Loader2 className='animate-spin' /> : <Send />}
                            <span className='font-heading font-bold text-base'>ส่งขออนุมัติ</span>
                        </Button>
                    </div>
                </div>
                {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
            </DialogContent>
        </Dialog>
    )
}
