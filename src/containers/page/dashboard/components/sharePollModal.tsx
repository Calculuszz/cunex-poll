'use client'
import React, { useSyncExternalStore } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// origin รู้ได้เฉพาะฝั่ง client ตอน server render ให้เป็นค่าว่างไปก่อน (dialog ยังไม่เปิดอยู่แล้ว)
const subscribeNoop = () => () => {}
const useOrigin = () => useSyncExternalStore(subscribeNoop, () => window.location.origin, () => '')

// ลิงก์แชร์ชี้ไปหน้ากรอกโพล /(slug) ไม่ใช่หน้าดูผล (System flow §แชร์ link / QR)
export function SharePollModal({ pollId, open, onOpenChange }: {
    pollId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const url = `${useOrigin()}/${pollId}`

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            toast.success('คัดลอกลิงก์แล้ว')
        } catch {
            toast.error('คัดลอกไม่สำเร็จ ลองคัดลอกจากช่องลิงก์แทน')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='flex flex-col gap-4'>
                <DialogTitle className='font-heading text-xl font-bold'>แชร์โพล</DialogTitle>
                <DialogDescription className='sr-only'>สแกน QR code หรือคัดลอกลิงก์เพื่อส่งให้ผู้ตอบ</DialogDescription>
                {/* พื้นขาวรอบ QR ให้สแกนติดเสมอ แม้ธีมจะเปลี่ยน */}
                <div className='self-center rounded-xl border bg-white p-3'>
                    <QRCodeSVG value={url} size={160} marginSize={0} title='QR code ลิงก์โพล' />
                </div>
                <div className='flex items-center gap-2'>
                    <Input readOnly value={url} aria-label='ลิงก์โพล' className='min-w-0 flex-1 truncate' onFocus={(e) => e.currentTarget.select()} />
                    <Button type='button' variant='outline' size='icon' className='size-10 shrink-0' aria-label='คัดลอกลิงก์' onClick={copy}>
                        <Copy />
                    </Button>
                </div>
                <Button variant='outline' className='self-end rounded-full border-ink-400 px-5 font-heading text-base font-bold text-ink-700' onClick={() => onOpenChange(false)}>
                    ปิด
                </Button>
            </DialogContent>
        </Dialog>
    )
}
