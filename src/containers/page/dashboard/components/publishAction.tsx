'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

// ปุ่ม Publish ของโพลที่อนุมัติแล้ว: เปิดให้เริ่มรับคำตอบทันที (System flow §7)
// expired = เลยเวลาปิดแล้ว เปิดไม่ได้ (API ตรวจซ้ำ)
export function PublishAction({ pollId, expired }: { pollId: string; expired: boolean }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const publish = async () => {
        setPending(true)
        setError(null)
        try {
            const res = await fetch(`/api/polls/${pollId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'VOTING' }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'เปิดโหวตไม่สำเร็จ')
                return
            }
            setOpen(false)
            toast.success('เปิดโหวตแล้ว แชร์ลิงก์ให้ผู้ตอบได้เลย')
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className='flex flex-col gap-3 rounded-2xl bg-inner-bg px-4 py-6 text-center'>
            <p className='text-ink-500'>
                {expired ? 'เลยเวลาปิดโหวตที่ตั้งไว้แล้ว จึงเปิดโหวตโพลนี้ไม่ได้' : 'โพลนี้อนุมัติแล้ว กดเปิดโหวตเมื่อพร้อมให้เริ่มรับคำตอบ'}
            </p>
            {!expired && (
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
                            ผู้ที่มีลิงก์จะเริ่มตอบได้ทันที<br />หลังเปิดแล้วแก้โพลและการแสดงผลแบบเรียลไทม์ไม่ได้
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
