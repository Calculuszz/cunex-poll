import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ลิงก์ที่ไม่มีหน้านี้ (พิมพ์ผิด / ลิงก์เก่า) · หน้าโพลมี not-found ของตัวเองใน (vote)/[slug]
export default function NotFound() {
    return (
        <main className='flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center'>
            <span className='flex size-16 items-center justify-center rounded-full bg-inner-bg text-ink-500'><SearchX className='size-8' /></span>
            <h1 className='font-heading text-2xl font-bold'>ไม่พบหน้านี้</h1>
            <p className='text-ink-500'>ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกลบไปแล้ว</p>
            <Link href='/' className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 rounded-full font-heading text-base font-bold')}>
                กลับหน้าแรก
            </Link>
        </main>
    )
}
