'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Ban, Loader2, Settings2, Share2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CLOSE_REASON_MAX } from '@/lib/pollLabels'
import { cn } from '@/lib/utils'
import { SharePollModal } from './sharePollModal'

const pill = 'flex-1 rounded-full font-heading text-base font-bold'

// ปุ่มแชร์ / ตั้งค่าการเผยแพร่ผลให้ผู้ตอบ / ปิดรับคำตอบ (ปิดได้เฉพาะตอนกำลังโหวต)
export function PollActions({ pollId, voting }: { pollId: string; voting: boolean }) {
    const router = useRouter()
    const [shareOpen, setShareOpen] = useState(false)
    const [closeOpen, setCloseOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const closePoll = async () => {
        setPending(true)
        setError(null)
        try {
            const res = await fetch(`/api/polls/${pollId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DONE', reason: reason.trim() || undefined }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'ปิดรับคำตอบไม่สำเร็จ')
                return
            }
            setCloseOpen(false)
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className='flex gap-2'>
            <Button variant='outline' className={cn(pill, 'border-primary text-primary')} onClick={() => setShareOpen(true)}>
                <Share2 />
                แชร์
            </Button>
            <Link href={`/dashboard/${pollId}/publish`} className={cn(buttonVariants({ variant: 'outline' }), pill)}>
                <Settings2 />
                เผยแพร่ผล
            </Link>
            {voting && (
                <Button className={pill} onClick={() => setCloseOpen(true)}>
                    <Ban />
                    ปิดรับคำตอบ
                </Button>
            )}

            <SharePollModal pollId={pollId} open={shareOpen} onOpenChange={setShareOpen} />

            {/* dialog ยืนยันหน้าตาเดียวกับยืนยันการส่งขออนุมัติ */}
            <Dialog open={closeOpen} onOpenChange={(next) => { if (!pending) { setCloseOpen(next); setError(null) } }}>
                <DialogContent>
                    <div className='flex w-full flex-col items-center pt-4'>
                        <Ban className='size-14 text-primary' />
                        <DialogTitle className='py-6 font-heading text-xl font-bold'>ปิดรับคำตอบ ?</DialogTitle>
                        <DialogDescription className='text-center text-base'>
                            ผู้ตอบจะส่งคำตอบเพิ่มไม่ได้อีก<br />และเปิดรับคำตอบกลับมาใหม่ไม่ได้
                        </DialogDescription>
                        {/* เหตุผลไม่บังคับ ถ้าใส่ไว้ คนที่เปิดลิงก์โพลจะเห็น (System flow §7) */}
                        <div className='flex w-full flex-col gap-1 pt-4'>
                            <Label htmlFor='close-reason' className='text-base font-bold'>เหตุผล (ไม่บังคับ)</Label>
                            <Textarea
                                id='close-reason'
                                value={reason}
                                maxLength={CLOSE_REASON_MAX}
                                disabled={pending}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder='เช่น ได้จำนวนผู้ตอบครบแล้ว'
                                className='text-base'
                            />
                            <span className='text-sm text-ink-500'>ผู้ที่เปิดลิงก์โพลจะเห็นเหตุผลนี้ · {reason.length}/{CLOSE_REASON_MAX}</span>
                        </div>
                        <div className='flex w-full gap-2 py-4'>
                            <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => setCloseOpen(false)}>
                                ยกเลิก
                            </Button>
                            <Button className='flex-1' disabled={pending} aria-busy={pending} onClick={closePoll}>
                                {pending ? <Loader2 className='animate-spin' /> : <Ban />}
                                <span className='font-heading text-base font-bold'>ปิดรับคำตอบ</span>
                            </Button>
                        </div>
                    </div>
                    {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
                </DialogContent>
            </Dialog>
        </div>
    )
}
