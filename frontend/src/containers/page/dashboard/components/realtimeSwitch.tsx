'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api, errorMessage } from '@/api'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// เปิด/ปิดผลเรียลไทม์หลังส่งโพลแล้ว (PATCH /realtime) แก้ได้ตอนรออนุมัติและอนุมัติแล้ว API ตรวจสถานะซ้ำ
export function RealtimeSwitch({ pollId, realtime }: { pollId: string; realtime: boolean }) {
    const router = useRouter()
    const [checked, setChecked] = useState(realtime)
    const [pending, setPending] = useState(false)

    const change = async (next: boolean) => {
        setChecked(next)
        setPending(true)
        try {
            await api.polls.setRealtime(pollId, next)
            router.refresh()
        } catch (err) {
            setChecked(!next)
            toast.error(errorMessage(err, 'เปลี่ยนการแสดงผลแบบเรียลไทม์ไม่สำเร็จ'))
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
