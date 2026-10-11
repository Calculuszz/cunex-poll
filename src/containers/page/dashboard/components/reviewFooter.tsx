'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// footer ของแอดมินในหน้า dashboard: ยืนยัน = อนุมัติ, ปฏิเสธ = ไม่อนุมัติ (ใช้ได้เฉพาะโพลที่รออนุมัติ)
export function ReviewFooter({ pollId }: { pollId: string }) {
    const router = useRouter()
    const [busy, setBusy] = useState<'APPROVED' | 'REJECTED' | null>(null)
    const [error, setError] = useState<string | null>(null)

    const review = async (status: 'APPROVED' | 'REJECTED') => {
        setBusy(status)
        setError(null)
        try {
            const res = await fetch(`/api/polls/${pollId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'ดำเนินการไม่สำเร็จ')
                return
            }
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setBusy(null)
        }
    }

    return (
        <footer className='sticky bottom-0 mt-auto flex flex-col gap-2 border-t bg-background py-3'>
            <div className='flex gap-2'>
                <Button variant='destructive' className='flex-1' disabled={busy !== null} aria-busy={busy === 'REJECTED'} onClick={() => review('REJECTED')}>
                    {busy === 'REJECTED' ? <Loader2 className='animate-spin' /> : <X />}
                    <span className='font-heading text-base font-bold'>ปฏิเสธ</span>
                </Button>
                <Button className='flex-1' disabled={busy !== null} aria-busy={busy === 'APPROVED'} onClick={() => review('APPROVED')}>
                    {busy === 'APPROVED' ? <Loader2 className='animate-spin' /> : <Check />}
                    <span className='font-heading text-base font-bold'>ยืนยัน</span>
                </Button>
            </div>
            {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
        </footer>
    )
}
