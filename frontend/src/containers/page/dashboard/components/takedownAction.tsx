'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/api'
import { Button } from '@/components/ui/button'
import { ReasonDialog } from './reasonDialog'

// แอดมินถอดโพลที่เปิด/ปิดแล้ว (POST /admin/polls/:id/takedown): บังคับปิดและซ่อนจากหน้ารวมโพล ต้องระบุเหตุผล
export function TakedownAction({ pollId }: { pollId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const takedown = async (reason: string) => {
        try {
            await api.admin.takedown(pollId, reason)
            setOpen(false)
            toast.success('ถอดโพลแล้ว')
            router.refresh()
            return null
        } catch (err) {
            return errorMessage(err, 'ถอดโพลไม่สำเร็จ')
        }
    }

    return (
        <>
            <Button variant='outline' className='rounded-full border-destructive font-heading text-base font-bold text-destructive' onClick={() => setOpen(true)}>
                <ShieldOff />
                ถอดโพล
            </Button>
            <ReasonDialog
                open={open}
                onOpenChange={setOpen}
                icon={ShieldOff}
                title='ถอดโพลนี้ ?'
                description='โพลจะถูกปิดทันทีและหายจากหน้ารวมโพล ย้อนกลับไม่ได้'
                label='เหตุผล'
                placeholder='เช่น เนื้อหาไม่เหมาะสม'
                max={500}
                required
                confirmLabel='ถอดโพล'
                onConfirm={takedown}
            />
        </>
    )
}
