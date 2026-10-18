import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// API ตอบ 404 ทั้งโพลที่ไม่มีอยู่ ยังไม่เปิด และโพลที่บัญชีนี้ไม่อยู่ในกลุ่มผู้ตอบ (ตั้งใจไม่บอกว่าโพลมีจริงไหม)
export default function PollNotFound() {
    return (
        <div className='flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center'>
            <span className='flex size-16 items-center justify-center rounded-full bg-inner-bg text-ink-500'><SearchX className='size-8' /></span>
            <h1 className='font-heading text-2xl font-bold'>ไม่พบโพลนี้</h1>
            <p className='text-ink-500'>ลิงก์อาจไม่ถูกต้อง โพลยังไม่เปิดให้ตอบ<br />หรือบัญชีของคุณไม่อยู่ในกลุ่มผู้ตอบของโพลนี้</p>
            <Link href='/explore' className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 rounded-full font-heading text-base font-bold')}>
                ไปที่หน้าโพลที่ตอบได้
            </Link>
        </div>
    )
}
