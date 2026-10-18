'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, isApiError } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

// ปุ่ม Publish ของโพลที่อนุมัติแล้ว (POST /publish) เจ้าของเป็นคนกด · approved → open เริ่มรับคำตอบทันที
// expired = เลยเวลาปิดแล้ว ต้องเลื่อนเวลาปิดก่อน (backend ตอบ 422 CLOSES_AT_PASSED)
export function PublishAction({ pollId, expired, owner }: { pollId: string; expired: boolean; owner: boolean }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const publish = async () => {
        setPending(true)
        setError(null)
        try {
            await api.polls.publish(pollId)
            setOpen(false)
            toast.success('เปิดโหวตแล้ว แชร์ลิงก์ให้ผู้ตอบได้เลย')
            router.refresh()
        } catch (err) {
            setError(isApiError(err, 'CLOSES_AT_PASSED') ? 'เลยเวลาปิดโหวตแล้ว เลื่อนเวลาปิดก่อนเปิดโหวต' : errorMessage(err, 'เปิดโหวตไม่สำเร็จ'))
        } finally {
            setPending(false)
        }
    }

    const message = !owner
        ? 'โพลนี้อนุมัติแล้ว รอเจ้าของโพลกดเปิดโหวต'
        : expired
            ? 'เลยเวลาปิดโหวตที่ตั้งไว้แล้ว เลื่อนเวลาปิดด้านบนก่อนจึงจะเปิดโหวตได้'
            : 'โพลนี้อนุมัติแล้ว กดเปิดโหวตเมื่อพร้อมให้เริ่มรับคำตอบ'

    return (
        <div className='flex flex-col gap-3 rounded-2xl bg-inner-bg px-4 py-6 text-center'>
            <p className='text-ink-500'>{message}</p>
            {owner && !expired && (
                <Button className='h-11 w-full rounded-full font-heading text-base font-bold' onClick={() => setOpen(true)}>
                    <Rocket />
                    เปิดโหวต
                </Button>
            )}

            {/* dialog ยืนยันหน้าตาเดียวกับยืนยันการส่งขออนุมัติ */}
            <Dialog open={open} onOpenChange={(next) => { if (!pending) { setOpen(next); setError(null) } }}>
                <DialogContent>
                    <div className='flex w-full flex-col items-center pt-4'>
                        <Rocket className='size-14 text-primary' />
                        <DialogTitle className='py-6 font-heading text-xl font-bold'>เปิดโหวต ?</DialogTitle>
                        <DialogDescription className='text-center text-base'>
                            ผู้ที่มีลิงก์จะเริ่มตอบได้ทันที<br />หลังเปิดแล้วเปลี่ยนการแสดงผลแบบเรียลไทม์ไม่ได้
                        </DialogDescription>
                        <div className='flex w-full gap-2 py-4'>
                            <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => setOpen(false)}>
                                ยกเลิก
                            </Button>
                            <Button className='flex-1' disabled={pending} aria-busy={pending} onClick={publish}>
                                {pending ? <Loader2 className='animate-spin' /> : <Rocket />}
                                <span className='font-heading text-base font-bold'>เปิดโหวต</span>
                            </Button>
                        </div>
                    </div>
                    {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
                </DialogContent>
            </Dialog>
        </div>
    )
}
