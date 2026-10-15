'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'

// ปุ่มของการ์ดที่รออนุมัติ: ปฏิเสธ (ทำจากการ์ดได้เลย) และดูข้อมูล (ไปหน้าโพลของแอดมิน)
export function ReviewActions({ pollId }: { pollId: string }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reject = async () => {
        setBusy(true)
        setError(null)
        try {
            const res = await fetch(`/api/polls/${pollId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'REJECTED' }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'ดำเนินการไม่สำเร็จ')
                return
            }
            // การ์ดจะย้ายไปแท็บที่ตรงกับสถานะใหม่หลังดึงข้อมูลใหม่จากเซิร์ฟเวอร์
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex flex-wrap gap-2'>
                <Button variant='destructive' className='min-w-24 flex-1 px-4 py-5' disabled={busy} aria-busy={busy} onClick={reject}>
                    <span className='font-heading font-bold text-base'>ปฏิเสธ</span>
                </Button>
                <Link href={`/admin/${pollId}`} className={buttonVariants({ variant: 'outline', className: 'min-w-24 flex-1 px-4 py-5' })}>
                    <span className='font-heading font-bold text-base'>ดูข้อมูล</span>
                </Link>
            </div>
            {error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
        </div>
    )
}
