'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { CloudAlert } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// error ที่ไม่ได้ดักไว้ในหน้า (เช่น backend ล่มหรือตอบช้าเกิน) แทนหน้า error ภาษาอังกฤษของ Next.js
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <main className='flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center'>
            <span className='flex size-16 items-center justify-center rounded-full bg-inner-bg text-ink-500'><CloudAlert className='size-8' /></span>
            <h1 className='font-heading text-2xl font-bold'>เกิดข้อผิดพลาด</h1>
            <p className='text-ink-500'>ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งในอีกสักครู่</p>
            {error.digest && <p className='text-xs text-ink-400'>รหัสอ้างอิง {error.digest}</p>}
            <div className='mt-2 flex gap-2'>
                <Button className='rounded-full font-heading text-base font-bold' onClick={reset}>ลองใหม่</Button>
                <Link href='/' className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full font-heading text-base font-bold')}>
                    กลับหน้าแรก
                </Link>
            </div>
        </main>
    )
}
