'use client'
import React from 'react'
import { Eye, Send } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function SubmitDialog({ open, onOpenChange, onPreview, onSubmit }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPreview: () => void
    onSubmit: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='font-heading font-bold text-xl'>ส่งขออนุมัติโพลนี้?</DialogTitle>
                    <DialogDescription className='text-base'>
                        ตรวจสอบชื่อโพล ประเภทโพล เวลาปิด และคำถามให้ครบถ้วนก่อนส่ง ถ้ายังไม่แน่ใจกดดูตัวอย่างก่อนได้
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='bg-transparent'>
                    <Button variant='outline' className='px-4 py-5' onClick={onPreview}>
                        <Eye />
                        <span className='font-heading font-bold text-base'>ดูตัวอย่าง</span>
                    </Button>
                    <Button className='px-4 py-5' onClick={onSubmit}>
                        <Send />
                        <span className='font-heading font-bold text-base'>ส่ง</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
