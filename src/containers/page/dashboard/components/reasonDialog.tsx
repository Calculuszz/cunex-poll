'use client'
import React, { useState } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// dialog ยืนยันที่มีช่องเหตุผล (ปฏิเสธโพล / ถอดโพล) หน้าตาเดียวกับ dialog ยืนยันอื่นๆ
export function ReasonDialog({ open, onOpenChange, icon: Icon, title, description, label, placeholder, max, required, confirmLabel, onConfirm }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    icon: LucideIcon
    title: string
    description: string
    label: string
    placeholder: string
    max: number
    required?: boolean
    confirmLabel: string
    // คืนข้อความ error ถ้าไม่สำเร็จ
    onConfirm: (reason: string) => Promise<string | null>
}) {
    const [reason, setReason] = useState('')
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const confirm = async () => {
        setPending(true)
        setError(null)
        const failed = await onConfirm(reason.trim())
        setPending(false)
        if (failed) setError(failed)
        else setReason('')
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!pending) { onOpenChange(next); setError(null) } }}>
            <DialogContent>
                <div className='flex w-full flex-col items-center pt-4'>
                    <Icon className='size-14 text-destructive' />
                    <DialogTitle className='py-6 font-heading text-xl font-bold'>{title}</DialogTitle>
                    <DialogDescription className='text-center text-base'>{description}</DialogDescription>
                    <div className='flex w-full flex-col gap-1 pt-4'>
                        <Label htmlFor='reason-input' className='text-base font-bold'>{label}</Label>
                        <Textarea
                            id='reason-input'
                            value={reason}
                            maxLength={max}
                            disabled={pending}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={placeholder}
                            className='text-base'
                        />
                        <span className='self-end text-sm text-ink-500 tabular-nums'>{reason.length}/{max}</span>
                    </div>
                    <div className='flex w-full gap-2 py-4'>
                        <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => onOpenChange(false)}>
                            ยกเลิก
                        </Button>
                        <Button variant='destructive' className='flex-1' disabled={pending || (required && !reason.trim())} aria-busy={pending} onClick={confirm}>
                            {pending ? <Loader2 className='animate-spin' /> : <Icon />}
                            <span className='font-heading text-base font-bold'>{confirmLabel}</span>
                        </Button>
                    </div>
                </div>
                {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
            </DialogContent>
        </Dialog>
    )
}
