'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// เปิด/ปิดผลเรียลไทม์หลังส่งโพลแล้ว แก้ได้จนกว่าจะเปิดโหวต (System flow §8) API ตรวจสถานะซ้ำ
export function RealtimeSwitch({ pollId, realtime }: { pollId: string; realtime: boolean }) {
    const router = useRouter()
    const [checked, setChecked] = useState(realtime)
    const [pending, setPending] = useState(false)

    const change = async (next: boolean) => {
        setChecked(next)
        setPending(true)
        try {
            const res = await fetch(`/api/polls/${pollId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ realtime: next }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setChecked(!next)
                toast.error(data?.error ?? 'เปลี่ยนการแสดงผลแบบเรียลไทม์ไม่สำเร็จ')
                return
            }
            router.refresh()
        } catch {
            setChecked(!next)
            toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setPending(false)
        }
    }

    return (
        <span className='flex flex-col gap-1'>
            <span className='flex items-center gap-2'>
                <Switch id='poll-realtime' checked={checked} disabled={pending} onCheckedChange={change} />
                <Label htmlFor='poll-realtime' className='text-base font-normal'>{checked ? 'เปิด' : 'ปิด'}</Label>
            </span>
            <span className='text-sm text-ink-500'>เปลี่ยนได้จนกว่าจะเปิดโหวต</span>
        </span>
    )
}
