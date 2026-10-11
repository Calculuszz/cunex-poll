'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PollDetailDialog, type PollDetailJson } from './pollDetailDialog'

// ปุ่มของการ์ดที่รออนุมัติ: ดูข้อมูล, อนุมัติ, ปฏิเสธ
export function ReviewActions({ pollId }: { pollId: string }) {
    const router = useRouter()
    const [detailOpen, setDetailOpen] = useState(false)
    const [detail, setDetail] = useState<PollDetailJson | null>(null)
    const [detailError, setDetailError] = useState<string | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [busy, setBusy] = useState<'APPROVED' | 'REJECTED' | null>(null)
    const [error, setError] = useState<string | null>(null)

    const openDetail = async () => {
        setDetailOpen(true)
        setDetail(null)
        setDetailError(null)
        setDetailLoading(true)
        try {
            const res = await fetch(`/api/polls/${pollId}`)
            if (!res.ok) throw new Error('โหลดไม่สำเร็จ')
            setDetail(await res.json())
        } catch {
            setDetailError('โหลดข้อมูลโพลไม่สำเร็จ ลองใหม่อีกครั้ง')
        } finally {
            setDetailLoading(false)
        }
    }

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
            // การ์ดจะย้ายไปแท็บที่ตรงกับสถานะใหม่หลังดึงข้อมูลใหม่จากเซิร์ฟเวอร์
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex flex-wrap gap-2'>
                <Button variant='destructive' className='min-w-24 flex-1 px-4 py-5' disabled={busy !== null} aria-busy={busy === 'REJECTED'} onClick={() => review('REJECTED')}>
                    <span className='font-heading font-bold text-base'>ปฏิเสธ</span>
                </Button>
                <Button variant='outline' className='min-w-24 flex-1 px-4 py-5' onClick={openDetail}>
                    <span className='font-heading font-bold text-base'>ดูข้อมูล</span>
                </Button>
            </div>
            {error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
            <PollDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                detail={detail}
                error={detailError}
                loading={detailLoading}
            />
        </div>
    )
}
