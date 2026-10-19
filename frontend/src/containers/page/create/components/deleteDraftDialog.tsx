'use client'
import React, { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

// ยืนยันลบฉบับร่าง (DELETE /polls/:id) หน้าตาเดียวกับ dialog ยืนยันอื่นๆ
export function DeleteDraftDialog({ open, onOpenChange, onConfirm }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
}) {
    const [pending, setPending] = useState(false)
    const confirm = async () => {
        setPending(true)
        await onConfirm()
        setPending(false)
    }
    return (
        <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
            <DialogContent>
                <div className='flex w-full flex-col items-center pt-4'>
                    <Trash2 className='size-14 text-destructive' />
                    <DialogTitle className='py-6 font-heading text-xl font-bold'>ลบฉบับร่าง ?</DialogTitle>
                    <DialogDescription className='text-center text-base'>ฉบับร่างนี้จะหายไปจากรายการโพลของคุณ</DialogDescription>
                    <div className='flex w-full gap-2 py-4'>
                        <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => onOpenChange(false)}>
                            ยกเลิก
                        </Button>
                        <Button variant='destructive' className='flex-1' disabled={pending} aria-busy={pending} onClick={confirm}>
                            {pending ? <Loader2 className='animate-spin' /> : <Trash2 />}
                            <span className='font-heading text-base font-bold'>ลบ</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
