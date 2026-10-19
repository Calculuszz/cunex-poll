'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { ReasonDialog } from '@/containers/page/dashboard/components/reasonDialog'

// ปุ่มของการ์ดที่รออนุมัติ: ปฏิเสธ (ใส่ความเห็นถึงเจ้าของได้) และดูข้อมูล (ไปหน้าโพลของแอดมิน ซึ่งมีปุ่มอนุมัติ)
export function ReviewActions({ pollId }: { pollId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const reject = async (comment: string) => {
        try {
            await api.admin.reject(pollId, comment || undefined)
            setOpen(false)
            toast.success('ปฏิเสธแล้ว')
            // การ์ดจะย้ายไปแท็บที่ตรงกับสถานะใหม่หลังดึงข้อมูลใหม่จากเซิร์ฟเวอร์
            router.refresh()
            return null
        } catch (err) {
            return errorMessage(err, 'ปฏิเสธไม่สำเร็จ')
        }
    }

    return (
        <div className='flex flex-wrap gap-2'>
            <Button variant='destructive' className='min-w-24 flex-1 px-4 py-5' onClick={() => setOpen(true)}>
                <span className='font-heading font-bold text-base'>ปฏิเสธ</span>
            </Button>
            <Link href={`/admin/${pollId}`} className={buttonVariants({ variant: 'outline', className: 'min-w-24 flex-1 px-4 py-5' })}>
                <span className='font-heading font-bold text-base'>ดูข้อมูล</span>
            </Link>
            <ReasonDialog
                open={open}
                onOpenChange={setOpen}
                icon={X}
                title='ปฏิเสธโพลนี้ ?'
                description='เจ้าของโพลจะเห็นความเห็นนี้ แล้วแก้ไขส่งใหม่ได้'
                label='ความเห็นถึงเจ้าของโพล (ไม่บังคับ)'
                placeholder='เช่น ช่วยระบุวันจัดกิจกรรมในคำอธิบาย'
                max={1000}
                confirmLabel='ปฏิเสธ'
                onConfirm={reject}
            />
        </div>
    )
}
