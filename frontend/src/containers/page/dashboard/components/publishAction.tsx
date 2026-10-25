'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, isApiError } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatThaiDateTime } from '@/lib/thaiDate'

// ปุ่ม Publish ของโพลที่อนุมัติแล้ว (POST /publish) เจ้าของเป็นคนกด · approved → open
// ถ้าตั้ง opensAt ไว้ในอนาคต เลือกได้ว่าจะรอเวลาที่ตั้ง (ขึ้นรายการทันทีแต่รับคำตอบตอน opensAt) หรือเปิดรับคำตอบทันที (now)
// expired = เลยเวลาปิดแล้ว ต้องเลื่อนเวลาปิดก่อน (backend ตอบ 422 CLOSES_AT_PASSED)
export function PublishAction({ pollId, opensAt, expired, owner }: { pollId: string; opensAt: string | null; expired: boolean; owner: boolean }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState<'now' | 'scheduled' | null>(null)
    const [error, setError] = useState<string | null>(null)
    // เช็คตอนเปิด dialog ไม่ใช่ตอน render เผื่อเปิดหน้าทิ้งไว้จนเลยเวลา
    const [scheduled, setScheduled] = useState(false)

    const openDialog = () => {
        setScheduled(!!opensAt && new Date(opensAt).getTime() > Date.now())
        setOpen(true)
    }

    const publish = async (now: boolean) => {
        setPending(now ? 'now' : 'scheduled')
        setError(null)
        try {
            await api.polls.publish(pollId, now)
            setOpen(false)
            toast.success(!now
                ? `ตั้งเปิดโหวตแล้ว เริ่มรับคำตอบ ${formatThaiDateTime(opensAt!)}`
                : 'เปิดโหวตแล้ว แชร์ลิงก์ให้ผู้ตอบได้เลย')
            router.refresh()
        } catch (err) {
            setError(isApiError(err, 'CLOSES_AT_PASSED') ? 'เลยเวลาปิดโหวตแล้ว เลื่อนเวลาปิดก่อนเปิดโหวต' : errorMessage(err, 'เปิดโหวตไม่สำเร็จ'))
        } finally {
            setPending(null)
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
                <Button className='h-11 w-full rounded-full font-heading text-base font-bold' onClick={openDialog}>
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
                            {scheduled ? (
                                <>ตั้งเวลาเปิดไว้ {formatThaiDateTime(opensAt!)}<br />รอเวลาที่ตั้ง หรือเปิดรับคำตอบตอนนี้เลยก็ได้</>
                            ) : (
                                <>ผู้ที่มีลิงก์จะเริ่มตอบได้ทันที</>
                            )}
                            <br />หลังเปิดแล้วเปลี่ยนการแสดงผลแบบเรียลไทม์ไม่ได้
                        </DialogDescription>
                        {scheduled ? (
                            <div className='flex w-full flex-col gap-2 py-4'>
                                <Button className='w-full' disabled={!!pending} aria-busy={pending === 'now'} onClick={() => publish(true)}>
                                    {pending === 'now' ? <Loader2 className='animate-spin' /> : <Rocket />}
                                    <span className='font-heading text-base font-bold'>เปิดทันที</span>
                                </Button>
                                <Button variant='outline' className='w-full' disabled={!!pending} aria-busy={pending === 'scheduled'} onClick={() => publish(false)}>
                                    {pending === 'scheduled' ? <Loader2 className='animate-spin' /> : <CalendarClock />}
                                    <span className='font-heading text-base font-bold'>เปิดตามเวลาที่ตั้ง</span>
                                </Button>
                                <Button variant='ghost' className='w-full font-heading text-base font-bold' disabled={!!pending} onClick={() => setOpen(false)}>
                                    ยกเลิก
                                </Button>
                            </div>
                        ) : (
                            <div className='flex w-full gap-2 py-4'>
                                <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={!!pending} onClick={() => setOpen(false)}>
                                    ยกเลิก
                                </Button>
                                {/* ส่ง now ด้วย เผื่อนาฬิกาเครื่องเดินเร็วกว่า server จนเห็นว่าเลย opensAt แล้วแต่ server ยังไม่เลย */}
                                <Button className='flex-1' disabled={!!pending} aria-busy={!!pending} onClick={() => publish(true)}>
                                    {pending ? <Loader2 className='animate-spin' /> : <Rocket />}
                                    <span className='font-heading text-base font-bold'>เปิดโหวต</span>
                                </Button>
                            </div>
                        )}
                    </div>
                    {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
                </DialogContent>
            </Dialog>
        </div>
    )
}
